const { setHours, setMinutes, addDays } = require('date-fns');
const { supabase } = require('../integrations/supabase/client');
const { sendScheduleReport } = require('./emailService');

// Calculate next run time for a schedule
const calculateNextRun = (schedule) => {
  if (!schedule.active) {
    return null;
  }

  console.log('Calculating next run for schedule:', {
    id: schedule.id,
    timerType: schedule.timerType,
    lastRun: schedule.lastRun,
    minuteInterval: schedule.minuteInterval,
    hourInterval: schedule.hourInterval,
    dayTime: schedule.dayTime,
    weekDay: schedule.weekDay,
    weekTime: schedule.weekTime
  });

  const now = new Date();
  let nextRun = new Date(now);
  const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;

  try {
    switch (schedule.timerType) {
      case 'minute':
        if (!schedule.minuteInterval) return null;
        
        if (lastRun) {
          // Tính thời gian đã trôi qua kể từ lần chạy cuối
          const elapsedMinutes = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60));
          // Thời gian còn lại = Khoảng thời gian định kỳ - Thời gian đã trôi qua
          const remainingMinutes = schedule.minuteInterval - (elapsedMinutes % schedule.minuteInterval);
          // Next Run = Thời gian hiện tại + Thời gian còn lại
          nextRun = new Date(now.getTime() + remainingMinutes * 60 * 1000);
        } else {
          // Nếu chưa có lần chạy nào, tính từ thời gian hiện tại
          nextRun = new Date(now.getTime() + schedule.minuteInterval * 60 * 1000);
        }
        break;

      case 'hour':
        if (!schedule.hourInterval) return null;
        
        if (lastRun) {
          // Tính thời gian đã trôi qua kể từ lần chạy cuối
          const elapsedHours = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60 * 60));
          // Thời gian còn lại = Khoảng thời gian định kỳ - Thời gian đã trôi qua
          const remainingHours = schedule.hourInterval - (elapsedHours % schedule.hourInterval);
          // Next Run = Thời gian hiện tại + Thời gian còn lại
          nextRun = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);
        } else {
          // Nếu chưa có lần chạy nào, tính từ thời gian hiện tại
          nextRun = new Date(now.getTime() + schedule.hourInterval * 60 * 60 * 1000);
        }
        break;

      case 'day':
        if (!schedule.dayTime) return null;
        
        // Parse the time string
        const [dayHours, dayMinutes] = schedule.dayTime.split(':').map(Number);
        
        // Set the time to the specified time today
        nextRun = new Date(now);
        nextRun.setHours(dayHours, dayMinutes, 0, 0);
        
        // Nếu thời gian hôm nay đã qua, chuyển sang ngày mai
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'week':
        if (!schedule.weekTime) return null;
        
        // Parse the time string
        const [weekHours, weekMinutes] = schedule.weekTime.split(':').map(Number);
        
        if (schedule.weekDay === 'weekday') {
          // Tìm ngày gần nhất ≥ current_time rơi vào weekday
          nextRun = new Date(now);
          const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
          
          // Nếu hôm nay là weekday và chưa quá giờ
          if (currentDay >= 1 && currentDay <= 5) {
            nextRun = setHours(nextRun, weekHours);
            nextRun = setMinutes(nextRun, weekMinutes);
            
            // Nếu đã quá giờ, tìm ngày weekday tiếp theo
            if (nextRun <= now) {
              // Tìm ngày weekday tiếp theo
              let daysToAdd = 1;
              if (currentDay === 5) { // Friday
                daysToAdd = 3; // Next Monday
              }
              nextRun = addDays(nextRun, daysToAdd);
            }
          } else {
            // Nếu là cuối tuần, tìm thứ 2 tuần sau
            const daysToMonday = (8 - currentDay) % 7;
            nextRun = addDays(nextRun, daysToMonday);
            nextRun = setHours(nextRun, weekHours);
            nextRun = setMinutes(nextRun, weekMinutes);
          }
        } else {
          // Map day names to day numbers
          const dayMap = {
            'sunday': 0,
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6
          };
          
          const targetDay = dayMap[schedule.weekDay];
          if (targetDay === undefined) return null;
          
          // Tìm ngày kế tiếp đúng thứ X
          const currentDay = now.getDay();
          let daysToAdd = (targetDay - currentDay + 7) % 7;
          
          nextRun = new Date(now);
          nextRun = addDays(nextRun, daysToAdd);
          nextRun = setHours(nextRun, weekHours);
          nextRun = setMinutes(nextRun, weekMinutes);
          
          // Nếu thời gian hôm nay đã qua, chuyển sang tuần sau
          if (nextRun <= now) {
            nextRun = addDays(nextRun, 7);
          }
        }
        break;

      default:
        return null;
    }

    console.log('Next run calculated:', nextRun);
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run:', error);
    return null;
  }
};

// Check if a schedule should run now
const shouldRunNow = (schedule) => {
  if (!schedule.active) {
    return false;
  }

  const now = new Date();
  const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;

  // For minute timer
  if (schedule.timerType === 'minute' && schedule.minuteInterval) {
    if (!lastRun) return true;
    const minutesSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60));
    return minutesSinceLastRun >= schedule.minuteInterval;
  }

  // For hour timer
  if (schedule.timerType === 'hour' && schedule.hourInterval) {
    if (!lastRun) return true;
    const hoursSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60 * 60));
    return hoursSinceLastRun >= schedule.hourInterval;
  }

  // For day timer
  if (schedule.timerType === 'day') {
    if (!schedule.dayTime) return false;
    
    const [hours, minutes] = schedule.dayTime.split(':').map(Number);
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);
    
    // Check if it's time to run (within a 2-minute window)
    const diffMinutes = Math.abs((now.getTime() - targetTime.getTime()) / (1000 * 60));
    if (diffMinutes <= 1) {
      // Check if we've already run today
      if (lastRun) {
        const lastRunDay = lastRun.setHours(0, 0, 0, 0);
        const todayDay = now.setHours(0, 0, 0, 0);
        return lastRunDay < todayDay;
      }
      return true;
    }
    return false;
  }

  // For week timer
  if (schedule.timerType === 'week') {
    if (!schedule.weekDay || !schedule.weekTime) return false;
    
    const currentDay = now.getDay();
    const [targetHours, targetMinutes] = schedule.weekTime.split(':').map(Number);
    
    // Map day names to day numbers
    const daysMap = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0,
    };
    
    // Check if today is the target day
    const isTargetDay = 
      (daysMap[schedule.weekDay] === currentDay) || 
      (schedule.weekDay === 'weekday' && currentDay >= 1 && currentDay <= 5);
    
    if (!isTargetDay) return false;
    
    // Check if it's the target time (within a 2-minute window)
    const targetTime = new Date(now);
    targetTime.setHours(targetHours, targetMinutes, 0, 0);
    
    const diffMinutes = Math.abs((now.getTime() - targetTime.getTime()) / (1000 * 60));
    if (diffMinutes <= 1) {
      // Check if we've already run today
      if (lastRun) {
        const lastRunDay = lastRun.setHours(0, 0, 0, 0);
        const todayDay = new Date(now).setHours(0, 0, 0, 0);
        return lastRunDay < todayDay;
      }
      return true;
    }
    return false;
  }

  return false;
};

// Execute a schedule
const executeSchedule = async (prisma, schedule) => {
  try {
    const { runService } = require('./runService');
    
    console.log('Executing schedule:', {
      id: schedule.id,
      name: schedule.name,
      sendEmail: schedule.sendEmail,
      recipientEmail: schedule.recipientEmail
    });
    
    // Get the collection
    const collection = await prisma.collection.findUnique({
      where: { id: schedule.collectionId },
      include: {
        tests: true,
      },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    if (collection.tests.length === 0) {
      throw new Error('No tests found in this collection');
    }

    // Run the collection
    const result = await runService.runCollection(prisma, collection, schedule.userId);
    
    console.log('Collection run result:', {
      runId: result.runId,
      totalTests: result.totalTests,
      successCount: result.successCount,
      failureCount: result.failureCount
    });

    // Update schedule last run time
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        lastRun: new Date(),
      },
    });

    // Update the run to link it to the schedule
    await prisma.collectionRun.update({
      where: { id: result.runId },
      data: {
        scheduleId: schedule.id,
      },
    });

    // Send email report if enabled
    if (schedule.sendEmail || schedule.sendEmailReport) {
      console.log('Sending email report to:', schedule.recipientEmail);
      try {
        await sendScheduleReport(result, schedule, [schedule.recipientEmail]);
        console.log('Email report sent successfully');
      } catch (emailError) {
        console.error('Error sending email report:', emailError);
      }
    } else {
      console.log('Email reporting is disabled for this schedule');
    }

    return {
      ...result,
      scheduleId: schedule.id,
    };
  } catch (error) {
    console.error('Error executing schedule:', error);
    throw error;
  }
};

// Check for schedules that need to run
const runScheduledTests = async (prisma) => {
  try {
    // Get all active schedules
    const schedules = await prisma.schedule.findMany({
      where: { active: true },
    });

    console.log(`Checking ${schedules.length} active schedules`);

    // Check each schedule
    for (const schedule of schedules) {
      if (shouldRunNow(schedule)) {
        console.log(`Running schedule ${schedule.id} - ${schedule.name}`);
        try {
          await executeSchedule(prisma, schedule);
          console.log(`Schedule ${schedule.id} completed successfully`);
        } catch (error) {
          console.error(`Error running schedule ${schedule.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error checking schedules:', error);
  }
};

// Export the functions
exports.calculateNextRun = calculateNextRun;
exports.shouldRunNow = shouldRunNow;
exports.executeSchedule = executeSchedule;
exports.runScheduledTests = runScheduledTests;

// Also export as scheduleService for consistency
exports.scheduleService = {
  calculateNextRun,
  shouldRunNow,
  executeSchedule,
  runScheduledTests,
};

async function runSchedule(scheduleId) {
  try {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Create run record
    const run = await createRun(scheduleId);
    
    // Run collection
    const results = await runCollection(schedule.collectionId);
    
    // Update run with results
    await updateRun(run.id, results);

    // Send email report if enabled
    if (schedule.sendEmail) {
      await sendScheduleReport(run, schedule, [schedule.recipientEmail]);
    }

    return run;
  } catch (error) {
    console.error('Error running schedule:', error);
    throw error;
  }
}

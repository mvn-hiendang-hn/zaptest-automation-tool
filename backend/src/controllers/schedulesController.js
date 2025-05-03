const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cronService = require('../services/cronService');

// Kiểm tra tên schedule có tồn tại không
const checkNameUniqueness = async (req, res) => {
  try {
    const { name, id } = req.body;
    const userId = req.user.id;

    // Tìm schedule có cùng tên và cùng user
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        name: name,
        userId: userId,
        NOT: {
          id: id || undefined
        }
      }
    });

    res.json({
      isUnique: !existingSchedule
    });
  } catch (error) {
    console.error('Error checking schedule name:', error);
    res.status(500).json({
      error: 'Lỗi kiểm tra tên schedule'
    });
  }
};

// Lấy danh sách schedules
const getSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: userId
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Format lại dữ liệu để thêm collectionName
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      collectionName: schedule.collection?.name || 'Unknown Collection'
    }));

    res.json(formattedSchedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({
      error: 'Lỗi lấy danh sách schedules'
    });
  }
};

// Tạo schedule mới
const createSchedule = async (req, res) => {
  try {
    const {
      name,
      collectionId,
      frequency,
      selectedDays,
      timerType,
      minuteInterval,
      hourInterval,
      dayTime,
      weekDay,
      weekTime,
      sendEmailReport,
      recipientEmail
    } = req.body;
    const userId = req.user.id;

    // Tạo cron expression dựa trên timerType
    let cronExpression = '';
    switch (timerType) {
      case 'minute':
        cronExpression = `*/${minuteInterval} * * * *`;
        break;
      case 'hour':
        cronExpression = `0 */${hourInterval} * * *`;
        break;
      case 'day':
        const [dayHours, dayMinutes] = dayTime.split(':');
        cronExpression = `${dayMinutes} ${dayHours} * * *`;
        break;
      case 'week':
        const [weekHours, weekMinutes] = weekTime.split(':');
        const weekDayMap = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'weekday': '1-5'
        };
        const weekDayNum = weekDayMap[weekDay];
        cronExpression = `${weekMinutes} ${weekHours} * * ${weekDayNum}`;
        break;
    }

    const schedule = await prisma.schedule.create({
      data: {
        name,
        collectionId,
        frequency,
        selectedDays,
        timerType,
        minuteInterval,
        hourInterval,
        dayTime,
        weekDay,
        weekTime,
        sendEmail: sendEmailReport,
        recipientEmail,
        active: true,
        cronExpression,
        userId
      }
    });

    // Tạo cron job cho schedule mới
    cronService.createCronJob(schedule);

    res.json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      error: 'Lỗi tạo schedule'
    });
  }
};

// Cập nhật schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      collectionId,
      frequency,
      selectedDays,
      timerType,
      minuteInterval,
      hourInterval,
      dayTime,
      weekDay,
      weekTime,
      sendEmailReport,
      recipientEmail
    } = req.body;
    const userId = req.user.id;

    // Tạo cron expression dựa trên timerType
    let cronExpression = '';
    switch (timerType) {
      case 'minute':
        cronExpression = `*/${minuteInterval} * * * *`;
        break;
      case 'hour':
        cronExpression = `0 */${hourInterval} * * *`;
        break;
      case 'day':
        const [dayHours, dayMinutes] = dayTime.split(':');
        cronExpression = `${dayMinutes} ${dayHours} * * *`;
        break;
      case 'week':
        const [weekHours, weekMinutes] = weekTime.split(':');
        const weekDayMap = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'weekday': '1-5'
        };
        const weekDayNum = weekDayMap[weekDay];
        cronExpression = `${weekMinutes} ${weekHours} * * ${weekDayNum}`;
        break;
    }

    const schedule = await prisma.schedule.update({
      where: {
        id,
        userId
      },
      data: {
        name,
        collectionId,
        frequency,
        selectedDays,
        timerType,
        minuteInterval,
        hourInterval,
        dayTime,
        weekDay,
        weekTime,
        sendEmail: sendEmailReport,
        recipientEmail,
        cronExpression
      }
    });

    // Cập nhật cron job
    cronService.createCronJob(schedule);

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      error: 'Lỗi cập nhật schedule'
    });
  }
};

// Xóa schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Dừng cron job
    cronService.stopCronJob(id);

    await prisma.schedule.delete({
      where: {
        id,
        userId
      }
    });

    res.json({
      message: 'Xóa schedule thành công'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      error: 'Lỗi xóa schedule'
    });
  }
};

// Cập nhật trạng thái schedule
const updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Kiểm tra schedule tồn tại
    const existingSchedule = await prisma.schedule.findUnique({
      where: {
        id,
        userId
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        error: 'Không tìm thấy schedule'
      });
    }

    // Cập nhật trạng thái active dựa trên status
    const active = status === 'active';
    const schedule = await prisma.schedule.update({
      where: {
        id,
        userId
      },
      data: {
        active
      }
    });

    // Cập nhật cron job
    if (active) {
      cronService.createCronJob(schedule);
    } else {
      cronService.stopCronJob(id);
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(500).json({
      error: 'Lỗi cập nhật trạng thái schedule'
    });
  }
};

// Chạy schedule
const runSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Lấy schedule và collection của nó
    const schedule = await prisma.schedule.findUnique({
      where: {
        id,
        userId
      },
      include: {
        collection: {
          include: {
            tests: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        error: 'Không tìm thấy schedule'
      });
    }

    // Tạo collection run mới
    const collectionRun = await prisma.collectionRun.create({
      data: {
        status: 'running',
        totalTests: schedule.collection.tests.length,
        userId,
        collectionId: schedule.collectionId,
        scheduleId: id
      }
    });

    // Chạy từng test trong collection
    const testResults = [];
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    for (const test of schedule.collection.tests) {
      try {
        const startTime = Date.now();
        
        // Gọi API
        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers || {},
          body: test.body || undefined
        });

        const duration = Date.now() - startTime;
        totalDuration += duration;

        // Lưu kết quả
        const testResult = await prisma.testResult.create({
          data: {
            statusCode: response.status,
            duration,
            response: await response.json(),
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });

        testResults.push(testResult);
        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        await prisma.testResult.create({
          data: {
            statusCode: 0,
            duration: 0,
            error: error.message,
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });
      }
    }

    // Cập nhật collection run
    await prisma.collectionRun.update({
      where: {
        id: collectionRun.id
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount,
        failureCount,
        totalDuration
      }
    });

    // Cập nhật lastRun của schedule
    await prisma.schedule.update({
      where: {
        id
      },
      data: {
        lastRun: new Date()
      }
    });

    res.json({
      message: 'Chạy schedule thành công',
      data: {
        collectionRun,
        testResults
      }
    });
  } catch (error) {
    console.error('Error running schedule:', error);
    res.status(500).json({
      error: 'Lỗi chạy schedule'
    });
  }
};

module.exports = {
  checkNameUniqueness,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  updateScheduleStatus,
  runSchedule
}; 
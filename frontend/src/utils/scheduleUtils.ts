import { addDays, addHours, addMinutes, format, setHours, setMinutes } from 'date-fns';

export const getScheduleDescription = (schedule: any): string => {
  if (!schedule) return '';

  switch (schedule.timerType) {
    case 'minute':
      return `Run every ${schedule.minuteInterval} minutes`;
    case 'hour':
      return `Run every ${schedule.hourInterval} hour${schedule.hourInterval > 1 ? 's' : ''}`;
    case 'day':
      return `Run daily at ${schedule.dayTime || '00:00'}`;
    case 'week':
      if (schedule.weekDay === 'everyday') {
        return `Run every day at ${schedule.weekTime || '00:00'}`;
      } else if (schedule.weekDay === 'weekday') {
        return `Run weekdays at ${schedule.weekTime || '00:00'}`;
      } else {
        return `Run every ${capitalizeFirstLetter(schedule.weekDay)} at ${schedule.weekTime || '00:00'}`;
      }
    default:
      return '';
  }
};

const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

type ScheduleTimerConfig = {
  timerType?: 'minute' | 'hour' | 'day' | 'week';
  minuteInterval?: number;
  hourInterval?: number;
  dayTime?: string;
  weekDay?: string;
  weekTime?: string;
  lastRun?: Date | null;
  selectedDays?: Array<number | string>;
};

export const calculateNextRunTime = (config: ScheduleTimerConfig): Date | null => {
  if (!config.timerType) return null;
  
  const now = new Date();
  let nextRun: Date;
  
  // Xử lý lastRun
  const lastRun = config.lastRun ? new Date(config.lastRun) : null;
  
  switch (config.timerType) {
    case 'minute':
      if (!config.minuteInterval) return null;
      
      if (lastRun) {
        // Tính thời gian đã trôi qua kể từ lần chạy cuối
        const elapsedMinutes = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60));
        // Thời gian còn lại = Khoảng thời gian định kỳ - Thời gian đã trôi qua
        const remainingMinutes = config.minuteInterval - (elapsedMinutes % config.minuteInterval);
        // Next Run = Thời gian hiện tại + Thời gian còn lại
        nextRun = addMinutes(now, remainingMinutes);
      } else {
        // Nếu chưa có lần chạy nào, tính từ thời gian hiện tại
        nextRun = addMinutes(now, config.minuteInterval);
      }
      break;
      
    case 'hour':
      if (!config.hourInterval) return null;
      
      if (lastRun) {
        // Tính thời gian đã trôi qua kể từ lần chạy cuối
        const elapsedHours = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60 * 60));
        // Thời gian còn lại = Khoảng thời gian định kỳ - Thời gian đã trôi qua
        const remainingHours = config.hourInterval - (elapsedHours % config.hourInterval);
        // Next Run = Thời gian hiện tại + Thời gian còn lại
        nextRun = addHours(now, remainingHours);
      } else {
        // Nếu chưa có lần chạy nào, tính từ thời gian hiện tại
        nextRun = addHours(now, config.hourInterval);
      }
      break;
      
    case 'day':
      if (!config.dayTime) return null;
      
      // Parse the time string
      const [dayHours, dayMinutes] = config.dayTime.split(':').map(Number);
      
      // Set the time to the specified time today
      nextRun = new Date(now);
      nextRun = setHours(nextRun, dayHours);
      nextRun = setMinutes(nextRun, dayMinutes);
      
      // Nếu thời gian hôm nay đã qua, chuyển sang ngày mai
      if (nextRun <= now) {
        nextRun = addDays(nextRun, 1);
      }
      break;
      
    case 'week':
      if (!config.weekTime) return null;
      
      // Parse the time string
      const [weekHours, weekMinutes] = config.weekTime.split(':').map(Number);
      
      if (config.weekDay === 'weekday') {
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
        const dayMap: Record<string, number> = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6
        };
        
        if (!config.weekDay || typeof config.weekDay !== 'string') return null;
        const targetDay = dayMap[config.weekDay.toLowerCase()];
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
  
  return nextRun;
};

export const formatNextRunTime = (nextRun: Date | null, isActive: boolean = true, schedule?: any): string => {
  if (!isActive) return 'Inactive';
  
  // Nếu không có nextRun nhưng lịch đang hoạt động, tính toán thời gian tiếp theo
  if (!nextRun && schedule) {
    nextRun = calculateNextRunTime({
      timerType: schedule.timerType,
      minuteInterval: schedule.minuteInterval,
      hourInterval: schedule.hourInterval,
      dayTime: schedule.dayTime,
      weekDay: schedule.weekDay,
      weekTime: schedule.weekTime,
      lastRun: schedule.lastRun
    });
  }
  
  if (!nextRun) return 'Inactive';
  
  const now = new Date();
  const diffMs = nextRun.getTime() - now.getTime();
  
  // Calculate time components
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format the relative time
  let relativeTime = '';
  if (diffMinutes < 60) {
    relativeTime = `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    relativeTime = `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    relativeTime = `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  // Format the exact time
  const exactTime = format(nextRun, 'M/d/yyyy, h:mm:ss a');
  
  return `${relativeTime}\n${exactTime}`;
};

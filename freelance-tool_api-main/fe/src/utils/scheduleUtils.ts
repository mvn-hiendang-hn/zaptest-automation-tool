
import { addDays, addHours, addMinutes, format, setHours, setMinutes, getDay } from 'date-fns';

export const getScheduleDescription = (schedule: any): string => {
  if (!schedule) return '';

  console.log("Check",schedule);

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
  
  // If there's no last run time, we calculate from now
  const lastRun = config.lastRun || now;
  
  let nextRun: Date;
  
  switch (config.timerType) {
    case 'minute':
      if (!config.minuteInterval) return null;
      nextRun = addMinutes(lastRun, config.minuteInterval);
      break;
      
    case 'hour':
      if (!config.hourInterval) return null;
      nextRun = addHours(lastRun, config.hourInterval);
      break;
      
    case 'day':
      if (!config.dayTime) return null;
      
      // Parse the time string
      const [dayHours, dayMinutes] = config.dayTime.split(':').map(Number);
      
      // Set the time to the specified time today
      nextRun = new Date(now);
      nextRun = setHours(nextRun, dayHours);
      nextRun = setMinutes(nextRun, dayMinutes);
      
      // If the time today has already passed, move to tomorrow
      if (nextRun < now) {
        nextRun = addDays(nextRun, 1);
      }
      break;
      
    case 'week':
      if (!config.weekTime) return null;
      
      // Parse the time string
      const [weekHours, weekMinutes] = config.weekTime.split(':').map(Number);
      
      // Find the next day to run based on weekDay setting
      let daysToAdd = 0;
      
      if (config.weekDay === 'everyday') {
        // Just use today with the specified time
        nextRun = new Date(now);
      } else if (config.weekDay === 'weekday') {
        // Find the next weekday (Monday-Friday)
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        if (currentDay === 0) { // Sunday
          daysToAdd = 1; // Next run on Monday
        } else if (currentDay === 6) { // Saturday
          daysToAdd = 2; // Next run on Monday
        } else {
          // It's a weekday, so run today or next weekday
          nextRun = new Date(now);
        }
        
        nextRun = addDays(new Date(now), daysToAdd);
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
        
        const targetDay = dayMap[config.weekDay];
        if (targetDay === undefined) return null;
        
        const currentDay = now.getDay();
        daysToAdd = (targetDay - currentDay + 7) % 7;
        
        // If today is the target day and the time hasn't passed yet, use today
        if (daysToAdd === 0 && now.getHours() < weekHours) {
          nextRun = new Date(now);
        } else if (daysToAdd === 0) {
          // Today is the target day but the time has passed, so use next week
          daysToAdd = 7;
          nextRun = addDays(new Date(now), daysToAdd);
        } else {
          // Use the calculated day
          nextRun = addDays(new Date(now), daysToAdd);
        }
      }
      
      // Set the time component
      nextRun = setHours(nextRun, weekHours);
      nextRun = setMinutes(nextRun, weekMinutes);
      break;
      
    default:
      return null;
  }
  
  return nextRun;
};

export const formatNextRunTime = (nextRun: Date | null): string => {
  if (!nextRun) return 'Not scheduled';
  
  const now = new Date();
  const diffMs = nextRun.getTime() - now.getTime();
  
  // If the next run is in the past, indicate it's due now
  if (diffMs < 0) {
    return 'Due now';
  }
  
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

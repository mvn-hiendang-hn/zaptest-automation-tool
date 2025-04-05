// Collection types
export interface APICollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  testCount: number;
}

// Test types
export interface SavedTest {
  id: string;
  name: string;
  timestamp: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  responseStatus: number;
}

// Schedule types
export type ScheduleFrequency = 'daily' | 'weekdays' | 'custom';

export interface ScheduleConfig {
  id?: string;
  name: string;
  collectionId: string;
  collectionName?: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  selectedDays: number[];
  timerType: 'minute' | 'hour' | 'day' | 'week';
  minuteInterval?: 5 | 15 | 30;
  hourInterval?: 1 | 2 | 4 | 6 | 12;
  dayTime?: string;
  weekDay?: 'everyday' | 'weekday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weekTime?: string;
  sendEmailReport: boolean;
}

export interface ScheduleWithCollection {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  frequency: ScheduleFrequency;
  selectedDays: number[];
  timerType: 'minute' | 'hour' | 'day' | 'week';
  minuteInterval?: 5 | 15 | 30;
  hourInterval?: 1 | 2 | 4 | 6 | 12;
  dayTime?: string;
  weekDay?: 'everyday' | 'weekday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weekTime?: string;
  sendEmailReport: boolean;
  lastRun: number | null;
  nextRun: number;
  active: boolean;
}

// API test data
export interface ApiTestData {
  id?: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Đảm bảo file được xem như một module
export {};

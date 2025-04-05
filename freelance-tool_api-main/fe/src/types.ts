// Collection types
export interface APICollection {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  testCount: number;
}

// Test types
export interface ApiTestData {
  id?: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, any>;
  body: any;
}

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
export interface ScheduleConfig {
  id?: string;
  name: string;
  collectionId: string;
  frequency: string;
  selectedDays: string[];
  timerType?: "minute" | "hour" | "day" | "week";
  minuteInterval?: 5 | 15 | 30;
  hourInterval?: 1 | 2 | 4 | 6 | 12;
  dayTime?: string;
  weekDay?: "everyday" | "weekday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  weekTime?: string;
  sendEmailReport: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  frequency: string;
  selectedDays: string[];
  timerType: "minute" | "hour" | "day" | "week";
  minuteInterval?: number | null;
  hourInterval?: number | null;
  dayTime?: string | null;
  weekDay?: string | null;
  weekTime?: string | null;
  sendEmailReport: boolean;
  lastRun: number | null;
  active: boolean;
  nextRun?: Date | null;
}

// Add ScheduleWithCollection type for SchedulesList component
export interface ScheduleWithCollection extends Schedule {
  collectionName: string;
}

// Test run types
export interface TestRun {
  id: string;
  name: string;
  timestamp: number;
  status: string;
  duration: number;
  testCount: number;
  successCount: number;
  userId: string;
}

// Request type for the Index page
export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

// Component prop types
export interface CollectionFormProps {
  onSave: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
  collection?: { id?: string; name: string; description?: string };
  saving: boolean;
}

export interface AddTestToCollectionDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  onSave: (testData: ApiTestData) => Promise<void>;
  saving: boolean;
  test?: ApiTestData;
}

export interface ScheduleFormProps {
  onSave: (schedule: ScheduleConfig) => Promise<void>;
  onCancel: () => void;
  collections: APICollection[];
  saving: boolean;
  schedule?: Schedule;
}

export interface TestsListProps {
  savedTests: SavedTest[];
  isLoading: boolean;
  onRemoveTest: (id: string) => Promise<void>;
  onSelectTest?: (test: SavedTest) => void;
  selectedTestId?: string;
  onEditTest?: (test: SavedTest) => void;
  onRunTest?: (test: SavedTest) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface TestHistoryProps {
  testRuns: TestRun[];
  isLoading: boolean;
  onViewDetails: (runId: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface SchedulesListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  runningSchedule: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

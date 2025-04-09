export interface Activity {
  id: string;
  name: string;
  totalTime: number; // in minutes
  color: string;
}

export type TimerState = 'idle' | 'running' | 'paused';

export interface TimerSettings {
  focusDuration: number; // in minutes
  selectedDuration?: number;
}

export type TimeLog = {
  id: string;
  activityId: string;
  duration: number; // in minutes
  timestamp: number;
};

export type TimeLogSummary = {
  totalSessions: number;
  totalMinutes: number;
  dailyLogs: Array<{
    date: string;
    logs: TimeLog[];
  }>;
  weeklyData: Array<{
    week: string;
    minutes: number;
  }>;
  monthlyData: Array<{
    month: string;
    minutes: number;
  }>;
  yearlyData: Array<{
    year: string;
    minutes: number;
  }>;
}; 
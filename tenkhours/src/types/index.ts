export type Activity = {
  id: string;
  name: string;
  totalTime: number; // in minutes
};

export type TimerState = 'idle' | 'running' | 'paused';

export type TimerSettings = {
  focusDuration: number; // in minutes
};

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
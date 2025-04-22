export interface Activity {
  id: string;
  name: string;
  totalTime: number; // in minutes
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  targetHours: number;
  activityId: string;
  createdAt: number;
  completedAt?: number;
  description?: string;
}

export interface TimerState {
  activityId: string | null;
  startTime: number | null;
  pausedTime: number | null;
  totalPausedTime: number;
  selectedDuration: number;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
}

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
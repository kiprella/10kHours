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
  activityIds: string[];
  activityId?: string; // legacy support
  createdAt: number;
  completedAt?: number;
  description?: string;
  targetDate?: number; // Unix timestamp for target completion date
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
  activityIds: string[];
  activityId?: string; // legacy support
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

// Velocity Insights Types
export interface WeeklyVelocityData {
  week: string;
  hours: number;
  sessions: number;
  date: Date;
}

export interface VelocityData {
  weeklyData: WeeklyVelocityData[];
  averageSlope: number; // hours per week
  currentStreak: number; // consecutive weeks meeting minimum target
  longestStreak: number;
  lastMissWeek?: string;
  momentumScore: number; // 0-100
  momentumTrend: 'rising' | 'flat' | 'declining';
  momentumChange: number; // percentage change vs last month
}

export interface StreakData {
  current: number;
  longest: number;
  lastMiss?: string;
  minimumSessions: number;
}

export interface MomentumScore {
  score: number; // 0-100
  trend: 'rising' | 'flat' | 'declining';
  change: number; // percentage change
  factors: {
    rollingAverage: number;
    standardDeviation: number;
    recentGrowth: number;
  };
}

export interface SessionQuality {
  averageSessionLength: number;
  focusDayAverage: number;
  nonFocusDayAverage: number;
  bestWeek: WeeklyVelocityData;
  unusualSessions: Array<{
    type: 'long' | 'short';
    duration: number;
    date: string;
  }>;
}

export interface MilestonePacing {
  targetDate?: Date;
  requiredWeeklyHours: number;
  currentWeeklyHours: number;
  gap: number; // hours per week needed
  isOnTrack: boolean;
}

export interface GoalAward {
  id: string;
  goalId: string;
  percentage: number; // 25, 50, 75, or 100
  awardedAt: number; // Unix timestamp
  message: string;
}

export interface GoalAwardData {
  awards: GoalAward[];
  nextMilestone: number | null; // Next percentage milestone to reach
  progressToNext: number; // Progress toward next milestone (0-100)
}

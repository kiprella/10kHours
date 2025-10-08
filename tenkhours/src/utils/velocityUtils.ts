import { TimeLog, WeeklyVelocityData, VelocityData, StreakData, MomentumScore, SessionQuality, MilestonePacing } from '@/types';

/**
 * Get ISO week number for a date using proper ISO 8601 week calculation
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  // Create a new date to avoid modifying the original
  const d = new Date(date);
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  // Return week number and year
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Calculate weekly velocity data for a goal
 */
export function calculateWeeklyVelocity(
  timeLogs: TimeLog[],
  goalActivityIds: string[],
  weeks: number = 8
): WeeklyVelocityData[] {
  if (goalActivityIds.length === 0) return [];

  const idSet = new Set(goalActivityIds);

  const goalLogs = timeLogs
    .filter(log => {
      if (log.activityIds) {
        return log.activityIds.some(id => idSet.has(id));
      }
      return log.activityId ? idSet.has(log.activityId) : false;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (goalLogs.length === 0) return [];

  const weeklyData = new Map<string, { hours: number; sessions: number; date: Date }>();
  const now = new Date();
  
  // Initialize last N weeks with zero data
  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    const { year, week } = getISOWeek(weekDate);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    weeklyData.set(weekKey, { hours: 0, sessions: 0, date: weekDate });
  }

  // Aggregate logs by week
  goalLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const { year, week } = getISOWeek(logDate);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    
    if (weeklyData.has(weekKey)) {
      const data = weeklyData.get(weekKey)!;
      data.hours += log.duration / 60;
      data.sessions += 1;
    }
  });

  return Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      hours: Math.round(data.hours * 10) / 10,
      sessions: data.sessions,
      date: data.date
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate average slope (hours per week) from weekly data
 */
export function calculateAverageSlope(weeklyData: WeeklyVelocityData[]): number {
  if (weeklyData.length < 2) return 0;
  
  const hours = weeklyData.map(w => w.hours);
  const n = hours.length;
  const sumX = (n * (n - 1)) / 2; // Sum of weeks (0, 1, 2, ...)
  const sumY = hours.reduce((sum, h) => sum + h, 0);
  const sumXY = hours.reduce((sum, h, i) => sum + h * i, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return Math.round(slope * 10) / 10;
}

/**
 * Calculate streak data for consistency tracking
 */
export function calculateStreakData(
  weeklyData: WeeklyVelocityData[],
  minimumSessions: number = 2
): StreakData {
  if (weeklyData.length === 0) {
    return { current: 0, longest: 0, minimumSessions };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let lastMiss: string | undefined;

  // Count backwards from most recent week
  for (let i = weeklyData.length - 1; i >= 0; i--) {
    const week = weeklyData[i];
    if (week.sessions >= minimumSessions) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      if (currentStreak > 0 && !lastMiss) {
        lastMiss = week.week;
      }
      currentStreak = 0;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    lastMiss,
    minimumSessions
  };
}

/**
 * Calculate momentum score based on rolling average, variance, and recent growth
 */
export function calculateMomentumScore(weeklyData: WeeklyVelocityData[]): MomentumScore {
  if (weeklyData.length < 4) {
    return {
      score: 50,
      trend: 'flat',
      change: 0,
      factors: { rollingAverage: 0, variance: 0, recentGrowth: 0 }
    };
  }

  const hours = weeklyData.map(w => w.hours);
  const recent = hours.slice(-4); // Last 4 weeks
  const previous = hours.slice(-8, -4); // Previous 4 weeks (if available)
  
  // Rolling 4-week average
  const rollingAverage = recent.reduce((sum, h) => sum + h, 0) / recent.length;
  
  // Variance (consistency) - calculate standard deviation
  const variance = recent.reduce((sum, h) => sum + Math.pow(h - rollingAverage, 2), 0) / recent.length;
  const standardDeviation = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 100 - (standardDeviation * 5)); // Lower std dev = higher score
  
  // Recent growth
  const previousSum = previous.reduce((sum, h) => sum + h, 0);
  const recentGrowth = previous.length > 0 && previousSum > 0
    ? ((recent.reduce((sum, h) => sum + h, 0) - previousSum) / previousSum) * 100
    : 0;
  const growthScore = Math.max(0, Math.min(100, 50 + recentGrowth * 2)); // -25% to +25% maps to 0-100
  
  // Overall momentum score - weighted combination
  const score = Math.round((rollingAverage * 0.4 + consistencyScore * 0.3 + growthScore * 0.3));
  
  // Determine trend
  let trend: 'rising' | 'flat' | 'declining' = 'flat';
  if (recentGrowth > 5) trend = 'rising';
  else if (recentGrowth < -5) trend = 'declining';

  return {
    score: Math.max(0, Math.min(100, score)),
    trend,
    change: Math.round(recentGrowth * 10) / 10,
    factors: {
      rollingAverage: Math.round(rollingAverage * 10) / 10,
      variance: Math.round(standardDeviation * 10) / 10, // Return std dev instead of variance
      recentGrowth: Math.round(recentGrowth * 10) / 10
    }
  };
}

/**
 * Calculate session quality insights
 */
export function calculateSessionQuality(
  timeLogs: TimeLog[],
  goalActivityIds: string[],
  weeklyData: WeeklyVelocityData[]
): SessionQuality {
  const idSet = new Set(goalActivityIds);

  const goalLogs = timeLogs.filter(log => {
    if (log.activityIds) {
      return log.activityIds.some(id => idSet.has(id));
    }
    return log.activityId ? idSet.has(log.activityId) : false;
  });
  
  if (goalLogs.length === 0) {
    return {
      averageSessionLength: 0,
      focusDayAverage: 0,
      nonFocusDayAverage: 0,
      bestWeek: weeklyData[0] || { week: '', hours: 0, sessions: 0, date: new Date() },
      unusualSessions: []
    };
  }

  // Calculate average session length
  const totalMinutes = goalLogs.reduce((sum, log) => sum + log.duration, 0);
  const averageSessionLength = totalMinutes / goalLogs.length;

  // Group by day to find focus vs non-focus days
  const dailySessions = new Map<string, TimeLog[]>();
  goalLogs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    if (!dailySessions.has(date)) {
      dailySessions.set(date, []);
    }
    dailySessions.get(date)!.push(log);
  });

  const dailyTotals = Array.from(dailySessions.entries()).map(([date, logs]) => ({
    date,
    totalMinutes: logs.reduce((sum, log) => sum + log.duration, 0),
    sessionCount: logs.length
  }));

  // Focus days: days with 2+ sessions or 60+ minutes
  const focusDays = dailyTotals.filter(day => day.sessionCount >= 2 || day.totalMinutes >= 60);
  const nonFocusDays = dailyTotals.filter(day => day.sessionCount < 2 && day.totalMinutes < 60);

  const focusDayAverage = focusDays.length > 0 
    ? focusDays.reduce((sum, day) => sum + day.totalMinutes, 0) / focusDays.length
    : 0;
  
  const nonFocusDayAverage = nonFocusDays.length > 0
    ? nonFocusDays.reduce((sum, day) => sum + day.totalMinutes, 0) / nonFocusDays.length
    : 0;

  // Find best week
  const bestWeek = weeklyData.reduce((best, week) => 
    week.hours > best.hours ? week : best, weeklyData[0] || { week: '', hours: 0, sessions: 0, date: new Date() }
  );

  // Find unusual sessions (2x average or 0.5x average)
  const unusualSessions = goalLogs
    .filter(log => {
      const ratio = log.duration / averageSessionLength;
      return ratio >= 2 || ratio <= 0.5;
    })
    .map(log => ({
      type: log.duration >= averageSessionLength * 2 ? 'long' as const : 'short' as const,
      duration: log.duration,
      date: new Date(log.timestamp).toISOString().split('T')[0]
    }))
    .slice(0, 5); // Limit to 5 most recent unusual sessions

  return {
    averageSessionLength: Math.round(averageSessionLength),
    focusDayAverage: Math.round(focusDayAverage),
    nonFocusDayAverage: Math.round(nonFocusDayAverage),
    bestWeek,
    unusualSessions
  };
}

/**
 * Calculate milestone pacing for calendar targets
 */
export function calculateMilestonePacing(
  goal: { id: string; activityIds: string[]; targetHours: number; createdAt: number; targetDate?: number },
  timeLogs: TimeLog[],
  targetDate?: Date
): MilestonePacing {
  const activityIdSet = new Set(goal.activityIds);

  // Calculate current progress from all time logs for this goal
  const goalLogs = timeLogs.filter(log => {
    if (log.activityIds) {
      return log.activityIds.some(id => activityIdSet.has(id));
    }
    return log.activityId ? activityIdSet.has(log.activityId) : false;
  });
  const currentProgress = goalLogs.reduce((sum, log) => sum + log.duration, 0) / 60; // Convert minutes to hours
  
  // Calculate current weekly pace from recent activity
  const recentLogs = goalLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);
    return logDate >= fourWeeksAgo;
  });
  const currentWeeklyHours = recentLogs.length > 0 
    ? (recentLogs.reduce((sum, log) => sum + log.duration, 0) / 60) / 4 // Average over 4 weeks
    : 0;

  // Use goal's targetDate if no targetDate parameter provided
  const effectiveTargetDate = targetDate || (goal.targetDate ? new Date(goal.targetDate) : undefined);
  
  if (!effectiveTargetDate) {
    return {
      requiredWeeklyHours: currentWeeklyHours,
      currentWeeklyHours,
      gap: 0,
      isOnTrack: true
    };
  }

  const now = new Date();
  const weeksRemaining = Math.max(1, (effectiveTargetDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const hoursRemaining = goal.targetHours - currentProgress;
  const requiredWeeklyHours = Math.max(0, hoursRemaining / weeksRemaining);

  return {
    targetDate: effectiveTargetDate,
    requiredWeeklyHours: Math.round(requiredWeeklyHours * 10) / 10,
    currentWeeklyHours: Math.round(currentWeeklyHours * 10) / 10,
    gap: Math.round((requiredWeeklyHours - currentWeeklyHours) * 10) / 10,
    isOnTrack: currentWeeklyHours >= requiredWeeklyHours * 0.9 // 90% threshold
  };
}

/**
 * Calculate comprehensive velocity data for a goal
 */
export function calculateVelocityData(
  goal: { id: string; targetHours: number; createdAt: number; activityIds: string[] },
  timeLogs: TimeLog[],
  weeks: number = 8
): VelocityData {
  const weeklyData = calculateWeeklyVelocity(timeLogs, goal.activityIds, weeks);
  const averageSlope = calculateAverageSlope(weeklyData);
  const streakData = calculateStreakData(weeklyData);
  const momentumScore = calculateMomentumScore(weeklyData);

  return {
    weeklyData,
    averageSlope,
    currentStreak: streakData.current,
    longestStreak: streakData.longest,
    lastMissWeek: streakData.lastMiss,
    momentumScore: momentumScore.score,
    momentumTrend: momentumScore.trend,
    momentumChange: momentumScore.change
  };
}
















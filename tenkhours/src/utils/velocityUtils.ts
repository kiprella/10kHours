import { TimeLog, WeeklyVelocityData, VelocityData, StreakData, MomentumScore, SessionQuality } from '@/types';

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
 * Get the UTC Monday date for a given ISO week of a year
 */
function getISOWeekStartDate(year: number, week: number): Date {
  // ISO week 1 is the week with Jan 4th in it. Find Monday of that week.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Sunday as 7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const target = new Date(mondayOfWeek1);
  target.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  return target;
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
  const { year: currentYear, week: currentWeek } = getISOWeek(new Date());
  const currentWeekStart = getISOWeekStartDate(currentYear, currentWeek);
  
  // Initialize last N weeks with zero data using ISO week starts (UTC Mondays)
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    const { year, week } = getISOWeek(weekStart);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    weeklyData.set(weekKey, { hours: 0, sessions: 0, date: weekStart });
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
 * Calculate average slope using full log history for accurate trend analysis
 */
export function calculateFullHistorySlope(
  timeLogs: TimeLog[],
  goalActivityIds: string[]
): number {
  if (goalActivityIds.length === 0) return 0;

  const idSet = new Set(goalActivityIds);
  const goalLogs = timeLogs
    .filter(log => {
      if (log.activityIds) {
        return log.activityIds.some(id => idSet.has(id));
      }
      return log.activityId ? idSet.has(log.activityId) : false;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (goalLogs.length === 0) return 0;

  // Group logs by week and calculate hours
  const weeklyHours = new Map<string, number>();
  goalLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const { year, week } = getISOWeek(logDate);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    weeklyHours.set(weekKey, (weeklyHours.get(weekKey) || 0) + log.duration / 60);
  });

  // Build continuous weeks from first activity through current ISO week, inserting zeros
  const allWeeks = Array.from(weeklyHours.keys()).sort();
  if (allWeeks.length === 0) return 0;

  const [firstYear, firstWeekNum] = allWeeks[0].split('-W').map(Number);
  const startDate = getISOWeekStartDate(firstYear, firstWeekNum);

  const [lastYear, lastWeekNum] = allWeeks[allWeeks.length - 1].split('-W').map(Number);
  const lastWeekStart = getISOWeekStartDate(lastYear, lastWeekNum);
  const now = new Date();
  const { year: currentYear, week: currentWeek } = getISOWeek(now);
  const currentWeekStart = getISOWeekStartDate(currentYear, currentWeek);
  const endDate =
    currentWeekStart.getTime() > lastWeekStart.getTime() ? currentWeekStart : lastWeekStart;

  const hours: number[] = [];
  const cursor = new Date(startDate);
  while (cursor.getTime() <= endDate.getTime()) {
    const { year, week } = getISOWeek(cursor);
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    hours.push(weeklyHours.get(key) || 0);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  if (hours.length < 2) return 0;
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
 * Calculate streak data using full log history for accurate streak tracking
 */
export function calculateFullHistoryStreakData(
  timeLogs: TimeLog[],
  goalActivityIds: string[],
  minimumSessions: number = 2
): StreakData {
  if (goalActivityIds.length === 0) {
    return { current: 0, longest: 0, minimumSessions };
  }

  const idSet = new Set(goalActivityIds);
  const goalLogs = timeLogs
    .filter(log => {
      if (log.activityIds) {
        return log.activityIds.some(id => idSet.has(id));
      }
      return log.activityId ? idSet.has(log.activityId) : false;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (goalLogs.length === 0) {
    return { current: 0, longest: 0, minimumSessions };
  }

  // Group logs by week
  const weeklySessions = new Map<string, number>();
  goalLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const { year, week } = getISOWeek(logDate);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    weeklySessions.set(weekKey, (weeklySessions.get(weekKey) || 0) + 1);
  });

  // Get all unique weeks from the activity data
  const allWeeks = Array.from(weeklySessions.keys()).sort();
  if (allWeeks.length === 0) {
    return { current: 0, longest: 0, minimumSessions };
  }

  // Generate timeline covering all weeks with activity
  const weeklyTimeline: { week: string; sessions: number; date: Date }[] = [];
  
  // Get the first and last week dates
  const firstWeek = allWeeks[0];
  const lastWeek = allWeeks[allWeeks.length - 1];
  
  // Parse first week to get ISO week start (Monday)
  const [firstYear, firstWeekNum] = firstWeek.split('-W').map(Number);
  const firstWeekStart = getISOWeekStartDate(firstYear, firstWeekNum);
  
  // Parse last week but extend the timeline through the current ISO week
  const now = new Date();
  const { year: currentYear, week: currentWeek } = getISOWeek(now);
  const currentWeekStart = getISOWeekStartDate(currentYear, currentWeek);
  const [lastYear, lastWeekNum] = lastWeek.split('-W').map(Number);
  const lastWeekStart = getISOWeekStartDate(lastYear, lastWeekNum);
  const endWeekStart =
    currentWeekStart.getTime() > lastWeekStart.getTime() ? currentWeekStart : lastWeekStart;
  
  // Generate timeline from first week to last week
  const currentDate = new Date(firstWeekStart);
  while (currentDate.getTime() <= endWeekStart.getTime()) {
    const { year, week } = getISOWeek(currentDate);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    const sessions = weeklySessions.get(weekKey) || 0;
    
    weeklyTimeline.push({
      week: weekKey,
      sessions,
      date: new Date(currentDate)
    });
    
    // Move to next ISO week (UTC Monday)
    currentDate.setUTCDate(currentDate.getUTCDate() + 7);
  }

  if (weeklyTimeline.length === 0) {
    return { current: 0, longest: 0, minimumSessions };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let lastMiss: string | undefined;

  // First, calculate the longest streak from all data
  let tempStreak = 0;
  for (let i = 0; i < weeklyTimeline.length; i++) {
    const week = weeklyTimeline[i];
    if (week.sessions >= minimumSessions) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Then, calculate the current streak from most recent week backwards
  for (let i = weeklyTimeline.length - 1; i >= 0; i--) {
    const week = weeklyTimeline[i];
    if (week.sessions >= minimumSessions) {
      currentStreak++;
    } else {
      if (!lastMiss) {
        lastMiss = week.week;
      }
      break; // Stop counting once we hit the first miss from the current streak
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
  const hours = weeklyData.map(w => w.hours);
  
  // Handle special case: insufficient data for full analysis
  if (weeklyData.length < 4) {
    if (weeklyData.length === 0) {
      return {
        score: 0,
        trend: 'flat',
        change: 0,
        factors: { rollingAverage: 0, standardDeviation: 0, recentGrowth: 0 }
      };
    }
    
    // For 1-3 weeks of data, focus on recent activity and growth potential
    const recent = hours.slice(-weeklyData.length);
    const rollingAverage = recent.reduce((sum, h) => sum + h, 0) / recent.length;
    
    // Scale volume to 0-100 based on reasonable weekly targets (0-20 hours maps to 0-100)
    const volumeScore = Math.min(100, (rollingAverage / 20) * 100);
    
    // Calculate growth from week-to-week if we have multiple weeks
    let recentGrowth = 0;
    if (weeklyData.length >= 2) {
      const currentWeek = recent[recent.length - 1];
      const previousWeek = recent[recent.length - 2];
      if (previousWeek > 0) {
        recentGrowth = ((currentWeek - previousWeek) / previousWeek) * 100;
      } else if (currentWeek > 0) {
        // If previous week was 0 but current week has activity, treat as 100% growth
        recentGrowth = 100;
      }
    }
    
    const growthScore = Math.max(0, Math.min(100, 50 + recentGrowth * 0.5)); // More conservative growth scaling
    
    // For limited data, weight volume more heavily and growth less
    const score = Math.round(volumeScore * 0.7 + growthScore * 0.3);
    
    // Determine trend based on recent growth
    let trend: 'rising' | 'flat' | 'declining' = 'flat';
    if (recentGrowth > 10) trend = 'rising';
    else if (recentGrowth < -10) trend = 'declining';
    
    return {
      score: Math.max(0, Math.min(100, score)),
      trend,
      change: Math.round(recentGrowth * 10) / 10,
      factors: {
        rollingAverage: Math.round(rollingAverage * 10) / 10,
        standardDeviation: 0, // Not enough data for meaningful standard deviation
        recentGrowth: Math.round(recentGrowth * 10) / 10
      }
    };
  }

  const recent = hours.slice(-4); // Last 4 weeks
  const previous = hours.slice(-8, -4); // Previous 4 weeks (if available)
  
  // Rolling 4-week average
  const rollingAverage = recent.reduce((sum, h) => sum + h, 0) / recent.length;
  
  // Scale volume to 0-100 based on reasonable weekly targets (0-20 hours maps to 0-100)
  const volumeScore = Math.min(100, (rollingAverage / 20) * 100);
  
  // Variance (consistency) - calculate standard deviation
  const variance = recent.reduce((sum, h) => sum + Math.pow(h - rollingAverage, 2), 0) / recent.length;
  const standardDeviation = Math.sqrt(variance);
  const consistencyScore = Math.min(100, Math.max(0, 100 - (standardDeviation * 5))); // Clamp to 0-100
  
  // Recent growth
  const recentSum = recent.reduce((sum, h) => sum + h, 0);
  const previousSum = previous.reduce((sum, h) => sum + h, 0);
  let recentGrowth = 0;

  if (previous.length > 0) {
    if (previousSum > 0) {
      recentGrowth = ((recentSum - previousSum) / previousSum) * 100;
    } else if (recentSum > 0) {
      recentGrowth = 100;
    }
  }
  const growthScore = Math.max(0, Math.min(100, 50 + recentGrowth * 2)); // -25% to +25% maps to 0-100
  
  // Overall momentum score - now all components are 0-100 scaled
  const score = Math.round((volumeScore * 0.4 + consistencyScore * 0.3 + growthScore * 0.3));
  
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
      standardDeviation: Math.round(standardDeviation * 10) / 10,
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

  let goalLogs = timeLogs.filter(log => {
    if (log.activityIds) {
      return log.activityIds.some(id => idSet.has(id));
    }
    return log.activityId ? idSet.has(log.activityId) : false;
  });

  if (weeklyData.length > 0) {
    const windowStart = new Date(weeklyData[0].date).getTime();
    const windowEnd = new Date(weeklyData[weeklyData.length - 1].date).getTime() + 7 * 24 * 60 * 60 * 1000;
    goalLogs = goalLogs.filter(log => log.timestamp >= windowStart && log.timestamp < windowEnd);
  }
  
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
  const goalLogsSorted = [...goalLogs].sort((a, b) => b.timestamp - a.timestamp);
  const unusualSessions = goalLogsSorted
    .filter(log => {
      const ratio = log.duration / averageSessionLength;
      return ratio >= 2 || ratio <= 0.5;
    })
    .slice(0, 5) // Keep newest outliers
    .map(log => ({
      type: log.duration >= averageSessionLength * 2 ? 'long' as const : 'short' as const,
      duration: log.duration,
      date: new Date(log.timestamp).toISOString().split('T')[0]
    }));

  return {
    averageSessionLength: Math.round(averageSessionLength),
    focusDayAverage: Math.round(focusDayAverage),
    nonFocusDayAverage: Math.round(nonFocusDayAverage),
    bestWeek,
    unusualSessions
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
  // Use 8-week window for display data (charts, recent trends)
  const weeklyData = calculateWeeklyVelocity(timeLogs, goal.activityIds, weeks);
  const recentSlope = calculateAverageSlope(weeklyData);
  
  // Use full history for accurate streak calculations
  const fullHistoryStreakData = calculateFullHistoryStreakData(timeLogs, goal.activityIds);
  
  // Use 8-week data for momentum score (recent trends)
  const momentumScore = calculateMomentumScore(weeklyData);

  const result = {
    weeklyData,
    averageSlope: recentSlope, // Use recent window slope for sparkline trend
    currentStreak: fullHistoryStreakData.current, // Use full history streak
    longestStreak: fullHistoryStreakData.longest, // Use full history longest streak
    lastMissWeek: fullHistoryStreakData.lastMiss, // Use full history last miss
    momentumScore: momentumScore.score,
    momentumTrend: momentumScore.trend,
    momentumChange: momentumScore.change
  };


  return result;
}
















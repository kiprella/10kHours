import { TimeLog, TimeLogSummary } from '@/types';
import { getValidatedTimeLogs } from './storage';

// Helper function to get ISO week number
const getISOWeek = (date: Date): { year: number; week: number } => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7; // Sunday should be treated as 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day); // Move to nearest Thursday
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = utcDate.getUTCFullYear();
  return { year, week };
};

export const getTimeLogSummary = async (): Promise<TimeLogSummary> => {
  const logs = await getValidatedTimeLogs();
  const dailyLogsMap = new Map<string, TimeLog[]>();
  const weeklyDataMap = new Map<string, number>();
  const monthlyDataMap = new Map<string, number>();
  const yearlyDataMap = new Map<string, number>();

  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const dayKey = date.toISOString().split('T')[0];
    const { year, week } = getISOWeek(date);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = String(date.getFullYear());

    // Daily logs
    if (!dailyLogsMap.has(dayKey)) {
      dailyLogsMap.set(dayKey, []);
    }
    dailyLogsMap.get(dayKey)?.push(log);

    // Weekly data
    weeklyDataMap.set(weekKey, (weeklyDataMap.get(weekKey) || 0) + log.duration);

    // Monthly data
    monthlyDataMap.set(monthKey, (monthlyDataMap.get(monthKey) || 0) + log.duration);

    // Yearly data
    yearlyDataMap.set(yearKey, (yearlyDataMap.get(yearKey) || 0) + log.duration);
  });

  return {
    totalSessions: logs.length,
    totalMinutes: logs.reduce((sum, log) => sum + log.duration, 0),
    dailyLogs: Array.from(dailyLogsMap.entries())
      .map(([date, logs]) => ({ date, logs }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    weeklyData: Array.from(weeklyDataMap.entries())
      .map(([week, minutes]) => ({ week, minutes }))
      .sort((a, b) => b.week.localeCompare(a.week)),
    monthlyData: Array.from(monthlyDataMap.entries())
      .map(([month, minutes]) => ({ month, minutes }))
      .sort((a, b) => b.month.localeCompare(a.month)),
    yearlyData: Array.from(yearlyDataMap.entries())
      .map(([year, minutes]) => ({ year, minutes }))
      .sort((a, b) => b.year.localeCompare(a.year)),
  };
}; 


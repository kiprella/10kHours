import { Activity, TimeLog, Goal, TimerState } from '@/types';
import * as clientStorage from './clientStorage';

// Activities
export async function getActivities(): Promise<Activity[]> {
  try {
    return await clientStorage.getActivities();
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  try {
    await clientStorage.saveActivity(activity);
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
}

// Time Logs
export async function getTimeLogs(): Promise<TimeLog[]> {
  try {
    return await clientStorage.getTimeLogs();
  } catch (error) {
    console.error('Error getting time logs:', error);
    return [];
  }
}

export async function saveTimeLog(log: TimeLog): Promise<void> {
  try {
    await clientStorage.saveTimeLog(log);
  } catch (error) {
    console.error('Error saving time log:', error);
    throw error;
  }
}

export async function updateActivityTotalTime(activityId: string, duration: number): Promise<void> {
  try {
    await clientStorage.updateActivityTotalTime(activityId, duration);
  } catch (error) {
    console.error('Error updating activity total time:', error);
    throw error;
  }
}

/**
 * Atomically saves a time log and updates the corresponding activity's total time.
 * Throws if any step fails.
 */
export async function addTimeLogAndUpdateActivity(log: TimeLog): Promise<void> {
  try {
    await clientStorage.saveTimeLog(log);
    await clientStorage.updateActivityTotalTime(log.activityId, log.duration);
  } catch (error) {
    console.error('Error saving time log and updating activity:', error);
    throw error;
  }
}

export async function updateActivity(activity: Activity): Promise<void> {
  try {
    await clientStorage.saveActivity(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  try {
    await clientStorage.deleteActivity(activityId);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Deletes an activity only if there are no time logs referencing it. Throws if logs exist.
 */
export async function deleteActivityWithReferentialIntegrity(activityId: string): Promise<void> {
  const logs = await clientStorage.getTimeLogs();
  const hasLogs = logs.some(log => log.activityId === activityId);
  if (hasLogs) {
    throw new Error('Cannot delete activity: time logs exist for this activity.');
  }
  await clientStorage.deleteActivity(activityId);
}

// Timer State
export async function getTimerState(): Promise<TimerState | null> {
  try {
    return await clientStorage.getTimerState();
  } catch (error) {
    console.error('Error getting timer state:', error);
    return null;
  }
}

export async function saveTimerState(state: TimerState): Promise<void> {
  try {
    await clientStorage.saveTimerState(state);
  } catch (error) {
    console.error('Error saving timer state:', error);
    throw error;
  }
}

// Goals
export async function getGoals(): Promise<Goal[]> {
  try {
    return await clientStorage.getGoals();
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
}

export async function saveGoal(goal: Goal): Promise<void> {
  try {
    await clientStorage.saveGoal(goal);
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
}

export async function updateGoal(goal: Goal): Promise<void> {
  try {
    await clientStorage.updateGoal(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    await clientStorage.deleteGoal(goalId);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

/**
 * Returns only time logs whose activityId matches an existing activity. Warns if orphans are found.
 */
export async function getValidatedTimeLogs(): Promise<TimeLog[]> {
  const [logs, activities] = await Promise.all([
    clientStorage.getTimeLogs(),
    clientStorage.getActivities()
  ]);
  const activityIds = new Set(activities.map(a => a.id));
  const validLogs = logs.filter(log => activityIds.has(log.activityId));
  if (validLogs.length !== logs.length) {
    console.warn('Orphaned time logs found and excluded.');
  }
  return validLogs;
} 
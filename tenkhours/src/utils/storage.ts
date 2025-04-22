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
    const activities = await clientStorage.getActivities();
    const filteredActivities = activities.filter(a => a.id !== activityId);
    await clientStorage.setStorageData(clientStorage.STORAGE_KEYS.ACTIVITIES, filteredActivities);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
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
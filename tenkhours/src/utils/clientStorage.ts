import { Activity, TimeLog, Goal, TimerState } from '@/types';

export const STORAGE_KEYS = {
  ACTIVITIES: 'activities',
  TIME_LOGS: 'timeLogs',
  GOALS: 'goals',
  TIMER_STATE: 'timerState'
} as const;

// Generic function to get data from storage
export async function getStorageData<T>(type: string): Promise<T[]> {
  try {
    const response = await fetch(`/api/storage?type=${type}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  } catch (error) {
    console.error(`Error getting ${type} data:`, error);
    return [];
  }
}

// Generic function to get single item from storage
export async function getStorageItem<T>(type: string): Promise<T | null> {
  try {
    const response = await fetch(`/api/storage?type=${type}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error getting ${type} data:`, error);
    return null;
  }
}

// Generic function to save data to storage
export async function setStorageData<T>(type: string, data: T[]): Promise<void> {
  try {
    const response = await fetch(`/api/storage?type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save data');
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    throw error;
  }
}

// Generic function to save single item to storage
export async function setStorageItem<T>(type: string, data: T): Promise<void> {
  try {
    const response = await fetch(`/api/storage?type=${type}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save data');
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    throw error;
  }
}

// Activities
export async function getActivities(): Promise<Activity[]> {
  return getStorageData<Activity>(STORAGE_KEYS.ACTIVITIES);
}

export async function saveActivity(activity: Activity): Promise<void> {
  const activities = await getActivities();
  const existingIndex = activities.findIndex(a => a.id === activity.id);
  
  if (existingIndex !== -1) {
    // Update existing activity
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.ACTIVITIES}&id=${activity.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!response.ok) throw new Error('Failed to update activity');
  } else {
    // Create new activity
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.ACTIVITIES}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!response.ok) throw new Error('Failed to save activity');
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  try {
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.ACTIVITIES}&id=${activityId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete activity');
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

// Time Logs
export async function getTimeLogs(): Promise<TimeLog[]> {
  return getStorageData<TimeLog>(STORAGE_KEYS.TIME_LOGS);
}

export async function saveTimeLog(log: TimeLog): Promise<void> {
  const response = await fetch(`/api/storage?type=${STORAGE_KEYS.TIME_LOGS}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
  if (!response.ok) throw new Error('Failed to save time log');
}

// Update activity total time
export async function updateActivityTotalTime(activityId: string, duration: number): Promise<void> {
  const activities = await getActivities();
  const activity = activities.find(a => a.id === activityId);
  
  if (activity) {
    activity.totalTime += duration;
    await saveActivity(activity);
  }
}

// Timer State
export async function getTimerState(): Promise<TimerState | null> {
  try {
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.TIMER_STATE}`);
    if (!response.ok) throw new Error('Failed to fetch timer state');
    const data = await response.json();
    
    // Validate timer state data
    if (data && typeof data === 'object') {
      const now = Date.now();
      
      // If timer was running but too much time has passed (>1 hour), clear the state
      if (data.isRunning && data.startTime) {
        const elapsed = now - data.startTime - (data.totalPausedTime || 0);
        if (elapsed > 3600000) { // 1 hour in milliseconds
          await clearTimerState();
          return null;
        }
        
        // Update timeLeft based on actual elapsed time
        const targetTime = data.selectedDuration * 60 * 1000;
        const remaining = Math.max(0, targetTime - elapsed);
        data.timeLeft = Math.ceil(remaining / 1000);
        
        // If timer has completed while away, clear it
        if (data.timeLeft <= 0) {
          await clearTimerState();
          return null;
        }
      }
      
      // If timer was paused but too much time has passed (>6 hours), clear the state
      if (data.isPaused && data.pausedTime) {
        const pausedDuration = now - data.pausedTime;
        if (pausedDuration > 21600000) { // 6 hours in milliseconds
          await clearTimerState();
          return null;
        }
      }
      
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error getting timer state:', error);
    return null;
  }
}

export async function saveTimerState(state: TimerState): Promise<void> {
  try {
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.TIMER_STATE}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (!response.ok) throw new Error('Failed to save timer state');
  } catch (error) {
    console.error('Error saving timer state:', error);
    throw error;
  }
}

export async function clearTimerState(): Promise<void> {
  try {
    const response = await fetch(`/api/storage?type=${STORAGE_KEYS.TIMER_STATE}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear timer state');
  } catch (error) {
    console.error('Error clearing timer state:', error);
    throw error;
  }
}

// Goals
export async function getGoals(): Promise<Goal[]> {
  return getStorageData<Goal>(STORAGE_KEYS.GOALS);
}

export async function saveGoal(goal: Goal): Promise<void> {
  const response = await fetch(`/api/storage?type=${STORAGE_KEYS.GOALS}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal)
  });
  if (!response.ok) throw new Error('Failed to save goal');
}

export async function updateGoal(goal: Goal): Promise<void> {
  const response = await fetch(`/api/storage?type=${STORAGE_KEYS.GOALS}&id=${goal.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal)
  });
  if (!response.ok) throw new Error('Failed to update goal');
}

export async function deleteGoal(goalId: string): Promise<void> {
  const response = await fetch(`/api/storage?type=${STORAGE_KEYS.GOALS}&id=${goalId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete goal');
} 
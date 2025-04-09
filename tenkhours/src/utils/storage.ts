import { Activity, TimeLog } from '@/types';

export const getActivities = async (): Promise<Activity[]> => {
  try {
    const response = await fetch('/api/storage?type=activities');
    if (!response.ok) throw new Error('Failed to fetch activities');
    return await response.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

export const saveActivity = async (activity: Activity): Promise<void> => {
  try {
    const response = await fetch('/api/storage?type=activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    if (!response.ok) throw new Error('Failed to save activity');
  } catch (error) {
    console.error('Error saving activity:', error);
  }
};

export const getTimeLogs = async (): Promise<TimeLog[]> => {
  try {
    const response = await fetch('/api/storage?type=timeLogs');
    if (!response.ok) throw new Error('Failed to fetch time logs');
    const logs = await response.json();
    console.log('Loaded time logs:', logs);
    return logs;
  } catch (error) {
    console.error('Error fetching time logs:', error);
    return [];
  }
};

export const saveTimeLog = async (log: TimeLog): Promise<void> => {
  try {
    const response = await fetch('/api/storage?type=timeLogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });
    if (!response.ok) throw new Error('Failed to save time log');
    console.log('Saved time log:', log);
  } catch (error) {
    console.error('Error saving time log:', error);
  }
};

export const updateActivityTotalTime = async (activityId: string, duration: number): Promise<void> => {
  try {
    const activities = await getActivities();
    const activity = activities.find(a => a.id === activityId);
    
    if (activity) {
      activity.totalTime += duration;
      await saveActivity(activity);
    }
  } catch (error) {
    console.error('Error updating activity total time:', error);
  }
}; 
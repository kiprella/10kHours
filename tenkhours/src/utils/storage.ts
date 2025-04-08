import { Activity, TimeLog } from '@/types';

const STORAGE_KEYS = {
  ACTIVITIES: 'pomodoro-activities',
  TIME_LOGS: 'pomodoro-time-logs',
} as const;

// Initialize with mock data if storage is empty
const initializeStorage = () => {
  if (typeof window === 'undefined') return;

  // Initialize activities if empty
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    const mockActivities = [
      {
        id: "activity-1",
        name: "Coding",
        totalTime: 1350
      },
      {
        id: "activity-2",
        name: "Reading",
        totalTime: 675
      },
      {
        id: "activity-3",
        name: "Learning",
        totalTime: 900
      },
      {
        id: "activity-4",
        name: "Writing",
        totalTime: 450
      },
      {
        id: "activity-5",
        name: "Planning",
        totalTime: 225
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(mockActivities));
  }

  // Initialize time logs if empty
  if (!localStorage.getItem(STORAGE_KEYS.TIME_LOGS)) {
    const mockTimeLogs = [
      {
        id: "log-1",
        activityId: "activity-1",
        duration: 45,
        timestamp: 1712505600000
      },
      {
        id: "log-2",
        activityId: "activity-2",
        duration: 45,
        timestamp: 1712509200000
      },
      {
        id: "log-3",
        activityId: "activity-1",
        duration: 45,
        timestamp: 1712512800000
      },
      {
        id: "log-4",
        activityId: "activity-3",
        duration: 45,
        timestamp: 1712516400000
      },
      {
        id: "log-5",
        activityId: "activity-1",
        duration: 45,
        timestamp: 1712520000000
      },
      {
        id: "log-6",
        activityId: "activity-4",
        duration: 45,
        timestamp: 1712523600000
      },
      {
        id: "log-7",
        activityId: "activity-2",
        duration: 45,
        timestamp: 1712527200000
      },
      {
        id: "log-8",
        activityId: "activity-1",
        duration: 45,
        timestamp: 1712530800000
      },
      {
        id: "log-9",
        activityId: "activity-5",
        duration: 45,
        timestamp: 1712534400000
      },
      {
        id: "log-10",
        activityId: "activity-3",
        duration: 45,
        timestamp: 1712538000000
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TIME_LOGS, JSON.stringify(mockTimeLogs));
  }
};

// Initialize storage on module load
if (typeof window !== 'undefined') {
  initializeStorage();
}

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
    return await response.json();
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
import { Activity, TimeLog, Goal, TimerState, GoalAward } from '@/types';
import * as clientStorage from './clientStorage';
import { ensureActivityColors } from './activityColors';

// Activities
export async function getActivities(): Promise<Activity[]> {
  try {
    const activities = await clientStorage.getActivities();
    return ensureActivityColors(activities);
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

export async function updateTimeLog(log: TimeLog): Promise<void> {
  try {
    await clientStorage.updateTimeLog(log);
  } catch (error) {
    console.error('Error updating time log:', error);
    throw error;
  }
}

/**
 * Updates a time log and adjusts the activity's total time accordingly.
 * This function handles the difference between old and new duration.
 */
export async function updateTimeLogAndAdjustActivity(
  logId: string, 
  updatedLog: TimeLog
): Promise<void> {
  try {
    // Get the original log to calculate the difference
    const originalLogs = await clientStorage.getTimeLogs();
    const originalLog = originalLogs.find(l => l.id === logId);
    
    if (!originalLog) {
      throw new Error('Time log not found');
    }
    
    // Calculate the duration difference
    const durationDifference = updatedLog.duration - originalLog.duration;
    
    // Update the time log
    await clientStorage.updateTimeLog(updatedLog);
    
    // Adjust the activity's total time by the difference
    if (durationDifference !== 0) {
      const activityId = updatedLog.activityIds?.[0] || updatedLog.activityId;
      if (activityId) {
        await clientStorage.updateActivityTotalTime(activityId, durationDifference);
      }
    }
    
  } catch (error) {
    console.error('Error updating time log and adjusting activity:', error);
    throw error;
  }
}

export async function deleteTimeLog(logId: string): Promise<void> {
  try {
    await clientStorage.deleteTimeLog(logId);
  } catch (error) {
    console.error('Error deleting time log:', error);
    throw error;
  }
}

/**
 * Deletes a time log and adjusts the activity's total time accordingly.
 * This function subtracts the deleted log's duration from the activity's total time.
 */
export async function deleteTimeLogAndAdjustActivity(logId: string): Promise<void> {
  try {
    // Get the original log to get its duration and activity
    const originalLogs = await clientStorage.getTimeLogs();
    const originalLog = originalLogs.find(l => l.id === logId);
    
    if (!originalLog) {
      throw new Error('Time log not found');
    }
    
    // Delete the time log
    await clientStorage.deleteTimeLog(logId);
    
    // Subtract the duration from the activity's total time
    const activityId = originalLog.activityIds?.[0] || originalLog.activityId;
    if (activityId) {
      await clientStorage.updateActivityTotalTime(activityId, -originalLog.duration);
    }
    
  } catch (error) {
    console.error('Error deleting time log and adjusting activity:', error);
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
 * If any step fails, attempts to rollback the changes to maintain data consistency.
 * Throws if any step fails.
 */
export async function addTimeLogAndUpdateActivity(log: TimeLog): Promise<void> {
  let timeLogSaved = false;
  let originalActivity: Activity | null = null;
  
  try {
    // Get the original activity state for potential rollback
    const activities = await clientStorage.getActivities();
    const activityId = log.activityIds?.[0] || log.activityId;
    originalActivity = activities.find(a => a.id === activityId) || null;
    
    // Save the time log first
    await clientStorage.saveTimeLog(log);
    timeLogSaved = true;
    
    // Update the activity total time
    if (activityId) {
      await clientStorage.updateActivityTotalTime(activityId, log.duration);
    }
    
  } catch (error) {
    console.error('Error saving time log and updating activity:', error);
    console.error('Time log data:', JSON.stringify(log, null, 2));
    console.error('Activity ID:', log.activityIds?.[0] || log.activityId);
    
    // Attempt rollback if time log was saved but activity update failed
    if (timeLogSaved) {
      try {
        console.log('Attempting to rollback: removing saved time log and restoring original activity state');
        
        // Remove the saved time log
        await clientStorage.deleteTimeLog(log.id);
        console.log('Time log removed successfully');
        
        // Restore original activity state if we have it
        if (originalActivity) {
          await clientStorage.saveActivity(originalActivity);
          console.log('Activity state restored successfully');
        }
        
        console.log('Rollback completed successfully');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
        // Log the inconsistency for manual resolution
        console.error('DATA INCONSISTENCY: Time log may be orphaned. Manual intervention may be required.');
        console.error('Orphaned log ID:', log.id);
        console.error('Original activity state:', originalActivity);
      }
    }
    
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
  const hasLogs = logs.some(log => 
    (log.activityIds && log.activityIds.includes(activityId)) || 
    log.activityId === activityId
  );
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
    const rawGoals = await clientStorage.getGoals();
    return rawGoals.map((goal) => {
      const migrated = goal as Goal & { activityId?: string };
      const idsFromData = migrated.activityIds && migrated.activityIds.length > 0
        ? migrated.activityIds
        : migrated.activityId
          ? [migrated.activityId]
          : [];
      const normalizedIds = Array.from(new Set(idsFromData));
      const sanitized = {
        ...migrated,
        activityIds: normalizedIds,
      } as Goal;
      delete (sanitized as unknown as Record<string, unknown>).activityId;
      return sanitized;
    });
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
  const validLogs = logs.filter(log => {
    if (log.activityIds) {
      return log.activityIds.some(id => activityIds.has(id));
    }
    return log.activityId ? activityIds.has(log.activityId) : false;
  });
  if (validLogs.length !== logs.length) {
    console.warn('Orphaned time logs found and excluded.');
  }
  return validLogs;
}

// Goal Awards
export async function getGoalAwards(): Promise<GoalAward[]> {
  try {
    return await clientStorage.getGoalAwards();
  } catch (error) {
    console.error('Error getting goal awards:', error);
    return [];
  }
}

export async function saveGoalAward(award: GoalAward): Promise<void> {
  try {
    await clientStorage.saveGoalAward(award);
  } catch (error) {
    console.error('Error saving goal award:', error);
    throw error;
  }
}

export async function saveGoalAwards(awards: GoalAward[]): Promise<void> {
  try {
    await clientStorage.saveGoalAwards(awards);
  } catch (error) {
    console.error('Error saving goal awards:', error);
    throw error;
  }
}

export async function deleteGoalAwards(goalId: string): Promise<void> {
  try {
    await clientStorage.deleteGoalAwards(goalId);
  } catch (error) {
    console.error('Error deleting goal awards:', error);
    throw error;
  }
}

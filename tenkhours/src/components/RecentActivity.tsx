import { useEffect, useState, useCallback } from 'react';
import { TimeLog, Activity } from '@/types';
import { getValidatedTimeLogs, getActivities, updateTimeLogAndAdjustActivity, deleteTimeLogAndAdjustActivity } from '@/utils/storage';
import Skeleton from './Skeleton';

const getPrimaryActivityId = (log: TimeLog): string =>
  log.activityIds?.[0] ?? log.activityId ?? '';

export default function RecentActivity() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    duration: number;
    activityId: string;
    timestamp: number;
  }>({ duration: 0, activityId: '', timestamp: 0 });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [logs, activitiesData] = await Promise.all([
        getValidatedTimeLogs(),
        getActivities()
      ]);

      const uniqueLogsMap = new Map<string, TimeLog>();
      logs.forEach(log => {
        const key = `${getPrimaryActivityId(log)}-${log.timestamp}`;
        if (!uniqueLogsMap.has(key)) {
          uniqueLogsMap.set(key, log);
        }
      });

      const uniqueLogs = Array.from(uniqueLogsMap.values());
      const sortedLogs = uniqueLogs.sort((a, b) => b.timestamp - a.timestamp);

      setTimeLogs(sortedLogs);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setError('Failed to load recent activity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('timeLogUpdated', handleUpdate);
    return () => {
      window.removeEventListener('timeLogUpdated', handleUpdate);
    };
  }, [loadData]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (log: TimeLog) => {
    setEditingLogId(log.id);
    setEditForm({
      duration: log.duration,
      activityId: getPrimaryActivityId(log),
      timestamp: log.timestamp
    });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditForm({ duration: 0, activityId: '', timestamp: 0 });
  };

  const handleSaveEdit = async () => {
    if (!editingLogId) return;

    try {
      const primaryActivityId = editForm.activityId;
      const updatedLog: TimeLog = {
        id: editingLogId,
        activityId: primaryActivityId,
        activityIds: primaryActivityId ? [primaryActivityId] : [],
        duration: editForm.duration,
        timestamp: editForm.timestamp
      };

      await updateTimeLogAndAdjustActivity(editingLogId, updatedLog);
      
      // Reload data to reflect changes
      await loadData();
      
      // Reset edit state
      setEditingLogId(null);
      setEditForm({ duration: 0, activityId: '', timestamp: 0 });
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      }
    } catch (error) {
      console.error('Error updating time log:', error);
      setError('Failed to update time log');
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this time log? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTimeLogAndAdjustActivity(logId);
      
      // Reload data to reflect changes
      await loadData();
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      }
    } catch (error) {
      console.error('Error deleting time log:', error);
      setError('Failed to delete time log');
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="space-y-2">
            <Skeleton variant="text" width={120} className="mb-1" />
            <Skeleton variant="text" width={80} height={12} />
          </div>
          <Skeleton variant="text" width={60} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Recent Activity</h2>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {timeLogs.map((log) => {
              const activityId = getPrimaryActivityId(log);
              const activity = activities.find(a => a.id === activityId);
              const isEditing = editingLogId === log.id;
              
              if (isEditing) {
                return (
                  <div
                    key={log.id}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Activity
                        </label>
                        <select
                          value={editForm.activityId}
                          onChange={(e) => setEditForm(prev => ({ ...prev, activityId: e.target.value }))}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {activities.map(activity => (
                            <option key={activity.id} value={activity.id}>
                              {activity.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={new Date(editForm.timestamp).toISOString().slice(0, 16)}
                          onChange={(e) => setEditForm(prev => ({ ...prev, timestamp: new Date(e.target.value).getTime() }))}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-slate-500 text-white text-sm rounded-md hover:bg-slate-600 focus:ring-2 focus:ring-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:bg-slate-100"
                >
                  <div className="flex flex-col">
                    <span 
                      className="font-medium"
                      style={{ color: activity?.color || '#64748B' }}
                    >
                      {activity?.name || 'Unknown Activity'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{formatTime(log.duration)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(log)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                        title="Edit time log"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        title="Delete time log"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {timeLogs.length === 0 && (
              <p className="text-slate-500">No recent activity</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

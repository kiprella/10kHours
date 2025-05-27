import { useEffect, useState } from 'react';
import { TimeLog, Activity } from '@/types';
import { getValidatedTimeLogs, getActivities } from '@/utils/storage';
import Skeleton from './Skeleton';

export default function RecentActivity() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [logs, activitiesData] = await Promise.all([
        getValidatedTimeLogs(),
        getActivities()
      ]);
      
      console.log('Original logs:', logs);
      
      // Create a map to store unique logs based on timestamp and activityId (ignore duration)
      const uniqueLogsMap = new Map();
      logs.forEach(log => {
        const key = `${log.activityId}-${log.timestamp}`;
        if (!uniqueLogsMap.has(key)) {
          uniqueLogsMap.set(key, log);
        }
      });
      
      // Convert map back to array and sort
      const uniqueLogs = Array.from(uniqueLogsMap.values());
      const sortedLogs = uniqueLogs.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log('Filtered logs:', sortedLogs);
      
      setTimeLogs(sortedLogs);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setError('Failed to load recent activity');
    } finally {
      setIsLoading(false);
    }
  };

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
              const activity = activities.find(a => a.id === log.activityId);
              return (
                <div
                  key={`${log.activityId}-${log.timestamp}`}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                      {activity?.name || 'Unknown Activity'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <span className="text-slate-600">{formatTime(log.duration)}</span>
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
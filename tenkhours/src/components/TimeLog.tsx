import { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { getActivities } from '@/utils/storage';
import Skeleton from './Skeleton';

export default function TimeLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activitiesData = await getActivities();
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" width={80} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Time Summary</h2>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="font-medium text-slate-800">{activity.name}</span>
                <span className="text-slate-600">{formatTime(activity.totalTime)}</span>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-slate-500">No activities logged yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
} 
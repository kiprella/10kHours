import { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { getActivities } from '@/utils/storage';

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
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
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
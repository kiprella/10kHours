import { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { getActivities } from '@/utils/storage';

export default function TimeLog() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      const activitiesData = await getActivities();
      setActivities(activitiesData);
    };
    loadActivities();
  }, []);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Time Summary</h2>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded"
          >
            <span className="font-medium">{activity.name}</span>
            <span className="text-gray-600">{formatTime(activity.totalTime)}</span>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-gray-500">No activities logged yet</p>
        )}
      </div>
    </div>
  );
} 
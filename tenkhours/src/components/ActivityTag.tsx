import { useState, useEffect } from 'react';
import { Activity } from '@/types';
import { getActivities, saveActivity } from '@/utils/storage';

interface ActivityTagProps {
  onSelect: (activity: Activity) => void;
  selectedActivity?: Activity;
}

export default function ActivityTag({ onSelect, selectedActivity }: ActivityTagProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadActivities();
  }, []);

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) return;

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      name: newActivityName.trim(),
      totalTime: 0,
    };

    try {
      await saveActivity(newActivity);
      setActivities((prev) => [...prev, newActivity]);
      setNewActivityName('');
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onSelect(activity)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedActivity?.id === activity.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {activity.name}
          </button>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={newActivityName}
          onChange={(e) => setNewActivityName(e.target.value)}
          placeholder="New activity name"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleCreateActivity}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add
        </button>
      </div>
    </div>
  );
} 
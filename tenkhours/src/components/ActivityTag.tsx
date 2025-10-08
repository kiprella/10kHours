import { useState, useEffect } from 'react';
import { Activity } from '@/types';
import { getNextActivityColor } from '@/utils/activityColors';
import { getActivities, saveActivity, updateActivity, deleteActivityWithReferentialIntegrity } from '@/utils/storage';

interface ActivityTagProps {
  onSelectActivity: (activity: Activity) => void;
}

export default function ActivityTag({ onSelectActivity }: ActivityTagProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const loadedActivities = await getActivities();
      setActivities(loadedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = async () => {
    if (newActivity.trim()) {
      try {
        setIsLoading(true);
        const activity: Activity = {
          id: Date.now().toString(),
          name: newActivity.trim(),
          totalTime: 0,
          color: getNextActivityColor(activities),
        };
        await saveActivity(activity);
        setActivities(prevActivities => [...prevActivities, activity]);
        setNewActivity('');
      } catch (error) {
        console.error('Error creating activity:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditText(activity.name);
  };

  const handleUpdateActivity = async () => {
    if (editingActivity && editText.trim()) {
      try {
        setIsLoading(true);
        const updatedActivity = {
          ...editingActivity,
          name: editText.trim(),
        };
        await updateActivity(updatedActivity);
        setActivities(prevActivities =>
          prevActivities.map(activity =>
            activity.id === updatedActivity.id ? updatedActivity : activity
          )
        );
        setEditingActivity(null);
        setEditText('');
      } catch (error) {
        console.error('Error updating activity:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        setIsLoading(true);
        await deleteActivityWithReferentialIntegrity(activityId);
        setActivities(prevActivities =>
          prevActivities.filter(activity => activity.id !== activityId)
        );
      } catch (error) {
        alert('Failed to delete activity: ' + (error instanceof Error ? error.message : error));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          placeholder="New activity"
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          onClick={handleCreateActivity}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          Add
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-2 px-3 py-1 rounded-lg border"
            style={{
              backgroundColor: `${activity.color}15`,
              borderColor: `${activity.color}40`,
              color: activity.color
            }}
          >
            {editingActivity?.id === activity.id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleUpdateActivity}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingActivity(null)}
                  className="px-2 py-1 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span 
                  className="text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => onSelectActivity(activity)}
                >
                  {activity.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditActivity(activity);
                  }}
                  className="px-2 py-1 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteActivity(activity.id);
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

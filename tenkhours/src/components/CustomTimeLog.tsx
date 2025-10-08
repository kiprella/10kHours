'use client';

import { useState, useEffect } from 'react';
import { Activity, TimeLog as TimeLogType } from '@/types';
import { addTimeLogAndUpdateActivity, getActivities } from '@/utils/storage';

export default function CustomTimeLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load activities on component mount
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const activitiesData = await getActivities();
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error loading activities:', error);
        setError('Failed to load activities');
      }
    };
    loadActivities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedActivityId || !startDateTime || !duration) {
      setError('Please fill in all fields');
      return;
    }

    const durationMinutes = parseFloat(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      setError('Please enter a valid duration');
      return;
    }

    const startTime = new Date(startDateTime).getTime();
    if (isNaN(startTime)) {
      setError('Please enter a valid date and time');
      return;
    }

    // Check if start time is in the future
    if (startTime > Date.now()) {
      setError('Start time cannot be in the future');
      return;
    }

    setIsLoading(true);

    try {
      const log: TimeLogType = {
        id: crypto.randomUUID(),
        activityIds: [selectedActivityId],
        duration: durationMinutes,
        timestamp: startTime,
      };

      await addTimeLogAndUpdateActivity(log);

      // Reset form
      setSelectedActivityId('');
      setStartDateTime('');
      setDuration('');
      setSuccess('Time log added successfully!');

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error adding time log:', error);
      setError('Failed to add time log: ' + (error instanceof Error ? error.message : error));
    } finally {
      setIsLoading(false);
    }
  };

  // Get current date/time for default value
  const getCurrentDateTime = () => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="card">
      <h2 className="heading-md mb-4">Add Custom Time</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Selection */}
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">
            Activity
          </label>
          <select
            id="activity"
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select an activity</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date/Time */}
        <div>
          <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            id="startDateTime"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            max={getCurrentDateTime()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="0.1"
            step="0.1"
            placeholder="e.g., 45.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding...' : 'Add Time Log'}
        </button>
      </form>
    </div>
  );
}

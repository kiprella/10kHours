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
    const tzOffset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - tzOffset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  // Helper function to set time while preserving date
  const setTime = (hours: number, minutes: number = 0) => {
    if (!startDateTime) {
      // If no date is set, use today
      const today = new Date();
      const tzOffset = today.getTimezoneOffset();
      const local = new Date(today.getTime() - tzOffset * 60 * 1000);
      local.setHours(hours, minutes, 0, 0);
      setStartDateTime(local.toISOString().slice(0, 16));
    } else {
      // Preserve existing date, update time
      const date = new Date(startDateTime);
      date.setHours(hours, minutes, 0, 0);
      const tzOffset = date.getTimezoneOffset();
      const local = new Date(date.getTime() - tzOffset * 60 * 1000);
      setStartDateTime(local.toISOString().slice(0, 16));
    }
  };

  // Helper function to adjust time by minutes
  const adjustTime = (minutes: number) => {
    if (!startDateTime) {
      const now = getCurrentDateTime();
      setStartDateTime(now);
      return;
    }
    const date = new Date(startDateTime);
    date.setMinutes(date.getMinutes() + minutes);
    const tzOffset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - tzOffset * 60 * 1000);
    setStartDateTime(local.toISOString().slice(0, 16));
  };

  // Get current time from datetime string
  const getCurrentTime = () => {
    if (!startDateTime) return { hours: 0, minutes: 0 };
    const date = new Date(startDateTime);
    return { hours: date.getHours(), minutes: date.getMinutes() };
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
          <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time
          </label>
          <div className="relative">
            {/* Calendar Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="datetime-local"
              id="startDateTime"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              max={getCurrentDateTime()}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm 
                         bg-white text-gray-900 font-medium
                         focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]
                         hover:border-gray-300 transition-all duration-200
                         placeholder:text-gray-400"
              placeholder="Select date and time"
              required
            />
          </div>
          {/* Quick Date Action Buttons */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const now = getCurrentDateTime();
                setStartDateTime(now);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#4F46E5] bg-indigo-50 
                         rounded-md hover:bg-indigo-100 active:bg-indigo-200 
                         transition-colors duration-150 border border-indigo-200"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tzOffset = today.getTimezoneOffset();
                const local = new Date(today.getTime() - tzOffset * 60 * 1000);
                setStartDateTime(local.toISOString().slice(0, 16));
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 
                         rounded-md hover:bg-gray-100 active:bg-gray-200 
                         transition-colors duration-150 border border-gray-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(12, 0, 0, 0);
                const tzOffset = yesterday.getTimezoneOffset();
                const local = new Date(yesterday.getTime() - tzOffset * 60 * 1000);
                setStartDateTime(local.toISOString().slice(0, 16));
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 
                         rounded-md hover:bg-gray-100 active:bg-gray-200 
                         transition-colors duration-150 border border-gray-200"
            >
              Yesterday
            </button>
          </div>

          {/* Time Selection Section */}
          {startDateTime && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Quick Time Selection</label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono font-semibold">
                    {getCurrentTime().hours.toString().padStart(2, '0')}:
                    {getCurrentTime().minutes.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Time Presets */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTime(9, 0)}
                  className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white 
                             rounded-md hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-300
                             active:bg-indigo-100 transition-all duration-150 border border-gray-200"
                >
                  9:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setTime(12, 0)}
                  className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white 
                             rounded-md hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-300
                             active:bg-indigo-100 transition-all duration-150 border border-gray-200"
                >
                  12:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => setTime(15, 0)}
                  className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white 
                             rounded-md hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-300
                             active:bg-indigo-100 transition-all duration-150 border border-gray-200"
                >
                  3:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => setTime(18, 0)}
                  className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white 
                             rounded-md hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-300
                             active:bg-indigo-100 transition-all duration-150 border border-gray-200"
                >
                  6:00 PM
                </button>
              </div>

              {/* Hour/Minute Adjusters */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hour</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const { hours } = getCurrentTime();
                        setTime(hours > 0 ? hours - 1 : 23, getCurrentTime().minutes);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-md 
                                 bg-white border border-gray-300 hover:bg-indigo-50 
                                 hover:border-indigo-300 active:bg-indigo-100 
                                 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={getCurrentTime().hours}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        setTime(Math.max(0, Math.min(23, hours)), getCurrentTime().minutes);
                      }}
                      className="w-16 px-2 py-1 text-center text-sm font-mono font-semibold 
                                 border border-gray-300 rounded-md focus:outline-none 
                                 focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const { hours } = getCurrentTime();
                        setTime(hours < 23 ? hours + 1 : 0, getCurrentTime().minutes);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-md 
                                 bg-white border border-gray-300 hover:bg-indigo-50 
                                 hover:border-indigo-300 active:bg-indigo-100 
                                 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-bold text-gray-300">:</div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Minute</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustTime(-15)}
                      className="w-8 h-8 flex items-center justify-center rounded-md 
                                 bg-white border border-gray-300 hover:bg-indigo-50 
                                 hover:border-indigo-300 active:bg-indigo-100 
                                 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="15"
                      value={getCurrentTime().minutes}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0;
                        setTime(getCurrentTime().hours, Math.max(0, Math.min(59, minutes)));
                      }}
                      className="w-16 px-2 py-1 text-center text-sm font-mono font-semibold 
                                 border border-gray-300 rounded-md focus:outline-none 
                                 focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    />
                    <button
                      type="button"
                      onClick={() => adjustTime(15)}
                      className="w-8 h-8 flex items-center justify-center rounded-md 
                                 bg-white border border-gray-300 hover:bg-indigo-50 
                                 hover:border-indigo-300 active:bg-indigo-100 
                                 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Minute Adjustments */}
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quick</label>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setTime(getCurrentTime().hours, 0)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-white 
                                 rounded border border-gray-300 hover:bg-indigo-50 
                                 hover:text-[#4F46E5] transition-colors duration-150"
                      title="Set to :00"
                    >
                      :00
                    </button>
                    <button
                      type="button"
                      onClick={() => setTime(getCurrentTime().hours, 30)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-white 
                                 rounded border border-gray-300 hover:bg-indigo-50 
                                 hover:text-[#4F46E5] transition-colors duration-150"
                      title="Set to :30"
                    >
                      :30
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

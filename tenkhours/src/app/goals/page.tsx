'use client';

import { useState, useEffect } from 'react';
import { Goal, Activity } from '@/types';
import { getGoals, saveGoal, updateGoal, deleteGoal, getActivities } from '@/utils/storage';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    targetHours: 10000,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [goalsData, activitiesData] = await Promise.all([
        getGoals(),
        getActivities(),
      ]);
      setGoals(goalsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading goals:', error);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      if (!newGoal.name || !newGoal.targetHours || !newGoal.activityId) {
        setError('Please fill in all required fields');
        return;
      }

      const goal: Goal = {
        id: Date.now().toString(),
        name: newGoal.name,
        targetHours: newGoal.targetHours,
        activityId: newGoal.activityId!,
        description: newGoal.description,
        createdAt: Date.now(),
      };

      await saveGoal(goal);
      await loadData();
      setIsCreating(false);
      setNewGoal({
        name: '',
        targetHours: 10000,
        description: '',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId);
        await loadData();
      } catch (error) {
        console.error('Error deleting goal:', error);
        setError('Failed to delete goal');
      }
    }
  };

  const calculateProgress = (goal: Goal) => {
    const activity = activities.find(a => a.id === goal.activityId);
    if (!activity) return 0;
    return (activity.totalTime / 60) / goal.targetHours * 100;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Goals</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Goal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Create New Goal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="E.g., Master Piano"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Hours
              </label>
              <input
                type="number"
                value={newGoal.targetHours}
                onChange={(e) => setNewGoal({ ...newGoal, targetHours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Activity
              </label>
              <select
                value={newGoal.activityId}
                onChange={(e) => setNewGoal({ ...newGoal, activityId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Add some details about your goal..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const activity = activities.find(a => a.id === goal.activityId);
          const progress = calculateProgress(goal);
          const hoursCompleted = activity ? Math.floor(activity.totalTime / 60) : 0;

          return (
            <div key={goal.id} className="bg-white p-6 rounded-lg shadow border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{goal.name}</h3>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-slate-500 mb-1">
                  Activity: {activity?.name || 'Unknown'}
                </div>
                {goal.description && (
                  <p className="text-sm text-slate-600">{goal.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">
                    {hoursCompleted} / {goal.targetHours} hours
                  </span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-right text-sm text-slate-500">
                  {progress.toFixed(1)}% Complete
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p className="text-slate-500">No goals created yet. Click "Create Goal" to get started!</p>
        </div>
      )}
    </div>
  );
} 
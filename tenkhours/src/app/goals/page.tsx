'use client';

import { useState, useEffect } from 'react';
import { Goal, Activity, TimeLog } from '@/types';
import { getGoals, saveGoal, updateGoal, deleteGoal, getActivities, getTimeLogs } from '@/utils/storage';
import VelocityInsights from '@/components/VelocityInsights';
import Modal from '@/components/Modal';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [compactView, setCompactView] = useState(false);
  const [isVelocityModalOpen, setIsVelocityModalOpen] = useState(false);
  const [velocityModalGoal, setVelocityModalGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    targetHours: 10000,
    activityIds: [],
  });
  const [editingGoal, setEditingGoal] = useState<Partial<Goal>>({
    name: '',
    targetHours: 10000,
    activityIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [goalsData, activitiesData, logsData] = await Promise.all([
        getGoals(),
        getActivities(),
        getTimeLogs(),
      ]);
      setGoals(goalsData);
      setActivities(activitiesData);
      setTimeLogs(logsData);
    } catch (error) {
      console.error('Error loading goals:', error);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      if (!newGoal.name || !newGoal.targetHours || !newGoal.activityIds || newGoal.activityIds.length === 0) {
        setError('Please fill in all required fields and select at least one activity');
        return;
      }

      const goal: Goal = {
        id: Date.now().toString(),
        name: newGoal.name!,
        targetHours: newGoal.targetHours!,
        activityIds: newGoal.activityIds!,
        description: newGoal.description,
        createdAt: Date.now(),
      };

      await saveGoal(goal);
      await loadData();
      setIsCreating(false);
      setNewGoal({
        name: '',
        targetHours: 10000,
        activityIds: [],
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal({
      id: goal.id,
      name: goal.name,
      targetHours: goal.targetHours,
      description: goal.description,
      activityIds: goal.activityIds,
    });
    setIsEditing(goal.id);
  };

  const handleUpdateGoal = async () => {
    try {
      if (!editingGoal.name || !editingGoal.targetHours || !editingGoal.activityIds || editingGoal.activityIds.length === 0) {
        setError('Please fill in all required fields and select at least one activity');
        return;
      }

      const updatedGoal: Goal = {
        id: editingGoal.id!,
        name: editingGoal.name!,
        targetHours: editingGoal.targetHours!,
        activityIds: editingGoal.activityIds!,
        description: editingGoal.description,
        createdAt: goals.find(g => g.id === editingGoal.id)?.createdAt || Date.now(),
      };

      await updateGoal(updatedGoal);
      await loadData();
      setIsEditing(null);
      setEditingGoal({
        name: '',
        targetHours: 10000,
        activityIds: [],
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('Failed to update goal');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditingGoal({
      name: '',
      targetHours: 10000,
      activityIds: [],
    });
  };

  const handleOpenVelocityModal = (goal: Goal) => {
    setVelocityModalGoal(goal);
    setIsVelocityModalOpen(true);
  };

  const handleCloseVelocityModal = () => {
    setIsVelocityModalOpen(false);
    setVelocityModalGoal(null);
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
    const goalActivities = activities.filter(a => goal.activityIds.includes(a.id));
    if (goalActivities.length === 0) return 0;
    
    const totalTime = goalActivities.reduce((sum, activity) => sum + activity.totalTime, 0);
    return (totalTime / 60) / goal.targetHours * 100;
  };

  // Forecast completion date for a goal based on current pace
  const getForecastDate = (goal: Goal) => {
    const goalActivities = activities.filter(a => goal.activityIds.includes(a.id));
    if (goalActivities.length === 0) return null;
    
    const totalTime = goalActivities.reduce((sum, activity) => sum + activity.totalTime, 0);
    const logs = timeLogs.filter(log => 
      log.activityIds ? goal.activityIds.some(id => log.activityIds!.includes(id)) : 
      log.activityId ? goal.activityIds.includes(log.activityId) : false
    );
    if (logs.length < 2) return null; // Not enough data

    const percentComplete = totalTime / (goal.targetHours * 60);
    let avgMinutesPerDay: number;

    if (percentComplete < 0.25) {
      avgMinutesPerDay = 240; // Always use 4h/day if less than 25% complete
    } else {
      const sortedLogs = logs.slice().sort((a, b) => a.timestamp - b.timestamp);
      const first = sortedLogs[0];
      const last = sortedLogs[sortedLogs.length - 1];
      const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
      const days = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24);
      if (days < 1) return null; // Not enough time span
      const realAverage = totalMinutes / days;
      if (realAverage === 0) return null;
      avgMinutesPerDay = Math.min(realAverage, 240);
    }

    const minutesLeft = goal.targetHours * 60 - totalTime;
    if (minutesLeft <= 0) return null;
    const daysLeft = minutesLeft / avgMinutesPerDay;
    const forecastDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
    return forecastDate;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={compactView ? 'space-y-3' : 'space-y-6'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Goals</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCompactView((v) => !v)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${compactView ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}
            title={compactView ? 'Switch to expanded view' : 'Switch to compact view'}
          >
            {compactView ? 'Expanded' : 'Compact'}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Goal
          </button>
        </div>
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
                Activities
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {activities.map((activity) => (
                  <label key={activity.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={newGoal.activityIds?.includes(activity.id) || false}
                      onChange={(e) => {
                        const currentIds = newGoal.activityIds || [];
                        if (e.target.checked) {
                          setNewGoal({ ...newGoal, activityIds: [...currentIds, activity.id] });
                        } else {
                          setNewGoal({ ...newGoal, activityIds: currentIds.filter(id => id !== activity.id) });
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm" style={{ color: activity.color }}>
                      {activity.name}
                    </span>
                  </label>
                ))}
              </div>
              {(!newGoal.activityIds || newGoal.activityIds.length === 0) && (
                <p className="text-xs text-red-500 mt-1">Please select at least one activity</p>
              )}
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

      {isEditing && (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Edit Goal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                value={editingGoal.name}
                onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
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
                value={editingGoal.targetHours}
                onChange={(e) => setEditingGoal({ ...editingGoal, targetHours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Activities
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {activities.map((activity) => (
                  <label key={activity.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={editingGoal.activityIds?.includes(activity.id) || false}
                      onChange={(e) => {
                        const currentIds = editingGoal.activityIds || [];
                        if (e.target.checked) {
                          setEditingGoal({ ...editingGoal, activityIds: [...currentIds, activity.id] });
                        } else {
                          setEditingGoal({ ...editingGoal, activityIds: currentIds.filter(id => id !== activity.id) });
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm" style={{ color: activity.color }}>
                      {activity.name}
                    </span>
                  </label>
                ))}
              </div>
              {(!editingGoal.activityIds || editingGoal.activityIds.length === 0) && (
                <p className="text-xs text-red-500 mt-1">Please select at least one activity</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={editingGoal.description}
                onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Add some details about your goal..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGoal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update Goal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`grid ${compactView ? 'gap-3' : 'gap-6'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
        {goals.map((goal) => {
          const goalActivities = activities.filter(a => goal.activityIds.includes(a.id));
          const progress = calculateProgress(goal);
          const hoursCompleted = Math.floor(goalActivities.reduce((sum, activity) => sum + activity.totalTime, 0) / 60);

          return (
            <div
              key={goal.id}
              className={`${
                compactView
                  ? 'bg-white p-3 rounded-lg shadow border border-slate-200 text-sm'
                  : 'bg-white p-6 rounded-lg shadow border border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={compactView ? 'font-semibold text-slate-800 text-base' : 'text-lg font-semibold text-slate-800'}>{goal.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditGoal(goal)}
                    className="text-slate-400 hover:text-indigo-600"
                    title="Edit goal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={compactView ? 'h-4 w-4' : 'h-5 w-5'} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-slate-400 hover:text-red-600"
                    title="Delete goal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={compactView ? 'h-4 w-4' : 'h-5 w-5'} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className={compactView ? 'mb-2' : 'mb-4'}>
                <div className="text-xs mb-1">
                  Activities: {goalActivities.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {goalActivities.map((activity) => (
                        <span
                          key={activity.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${activity.color}20`,
                            color: activity.color,
                            border: `1px solid ${activity.color}40`
                          }}
                        >
                          {activity.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">No activities selected</span>
                  )}
                </div>
                {!compactView && goal.description && (
                  <p className="text-sm text-slate-600">{goal.description}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-medium text-slate-800">
                    {hoursCompleted} / {goal.targetHours} hours
                  </span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: goalActivities.length > 0 ? goalActivities[0].color : '#4F46E5'
                    }}
                  />
                </div>
                <div className="text-right text-xs text-slate-500">
                  {progress.toFixed(1)}% Complete
                </div>
                {/* Milestone badges */}
                {goalActivities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 items-center justify-end">
                    {(() => {
                      const milestones = [100, 500, 1000, 5000, 10000];
                      const totalHours = Math.floor(goalActivities.reduce((sum, activity) => sum + activity.totalTime, 0) / 60);
                      let lastAchieved = -1;
                      milestones.forEach((m, i) => {
                        if (totalHours >= m) lastAchieved = i;
                      });
                      return milestones.map((milestone, i) => (
                        <span
                          key={milestone}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border transition-all
                            ${i === lastAchieved
                              ? 'bg-green-100 border-green-400 text-green-700 animate-pulse'
                              : totalHours >= milestone
                                ? 'bg-green-50 border-green-200 text-green-600'
                                : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'}
                          `}
                          title={totalHours >= milestone ? `Achieved ${milestone} hours!` : `Reach ${milestone} hours to unlock`}
                        >
                          <span role="img" aria-label="milestone">🏅</span> {milestone}h
                        </span>
                      ));
                    })()}
                  </div>
                )}
                {/* Forecasted completion date */}
                {(() => {
                  const forecast = getForecastDate(goal);
                  if (forecast) {
                    return (
                      <div className="text-xs text-green-600 text-right mt-1">
                        Est. completion: {forecast.toLocaleDateString()}
                      </div>
                    );
                  } else {
                    return null;
                  }
                })()}
              </div>

              {/* Velocity Insights Section */}
              {!compactView && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Velocity Insights</h4>
                    <button
                      onClick={() => handleOpenVelocityModal(goal)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-500">
                    Click &quot;View Details&quot; to see velocity trends, streaks, and momentum analysis
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {goals.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <p className="text-slate-500">No goals created yet. Click &quot;Create Goal&quot; to get started!</p>
        </div>
      )}

      {/* Velocity Insights Modal */}
      {velocityModalGoal && (
        <Modal
          isOpen={isVelocityModalOpen}
          onClose={handleCloseVelocityModal}
          title={`Velocity Insights - ${velocityModalGoal.name}`}
        >
          <VelocityInsights
            goal={velocityModalGoal}
            timeLogs={timeLogs.filter(log => 
              log.activityIds ? velocityModalGoal.activityIds.some(id => log.activityIds!.includes(id)) : 
              log.activityId ? velocityModalGoal.activityIds.includes(log.activityId) : false
            )}
            activityColor={activities.find(a => velocityModalGoal.activityIds.includes(a.id))?.color || '#4F46E5'}
          />
        </Modal>
      )}
    </div>
  );
} 

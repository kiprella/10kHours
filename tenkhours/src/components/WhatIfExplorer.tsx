'use client';

import { useState, useEffect, useCallback } from 'react';
import { Goal, TimeLog } from '@/types';

interface WhatIfExplorerProps {
  goal: Goal;
  timeLogs: TimeLog[];
  currentWeeklyHours: number;
  className?: string;
}

export default function WhatIfExplorer({ 
  goal, 
  timeLogs, 
  currentWeeklyHours,
  className = '' 
}: WhatIfExplorerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [simulatedWeeklyHours, setSimulatedWeeklyHours] = useState(currentWeeklyHours);
  const [simulatedCompletionDate, setSimulatedCompletionDate] = useState<Date | null>(null);

  const calculateSimulatedCompletion = useCallback(() => {
    // Use cumulative progress from all time logs, not just recent weeks
    const activityIdSet = new Set(goal.activityIds ?? []);
    if (activityIdSet.size === 0) {
      setSimulatedCompletionDate(null);
      return;
    }

    const goalLogs = timeLogs.filter(log => {
      if (log.activityIds) {
        return log.activityIds.some(id => activityIdSet.has(id));
      }
      return log.activityId ? activityIdSet.has(log.activityId) : false;
    });
    const currentProgress = goalLogs.reduce((sum, log) => sum + log.duration, 0) / 60; // Convert minutes to hours
    const hoursRemaining = goal.targetHours - currentProgress;
    
    if (hoursRemaining <= 0) {
      setSimulatedCompletionDate(null);
      return;
    }

    if (simulatedWeeklyHours <= 0) {
      setSimulatedCompletionDate(null);
      return;
    }

    const weeksRemaining = hoursRemaining / simulatedWeeklyHours;
    const completionDate = new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000);
    setSimulatedCompletionDate(completionDate);
  }, [goal, timeLogs, simulatedWeeklyHours]);

  useEffect(() => {
    if (isOpen) {
      calculateSimulatedCompletion();
    }
  }, [simulatedWeeklyHours, isOpen, calculateSimulatedCompletion]);

  const getCommitmentChange = () => {
    const change = simulatedWeeklyHours - currentWeeklyHours;
    return {
      value: change,
      percentage: currentWeeklyHours > 0 ? (change / currentWeeklyHours) * 100 : 0
    };
  };

  const getCommitmentLabel = (hours: number) => {
    if (hours < 1) return 'Very light';
    if (hours < 3) return 'Light';
    if (hours < 6) return 'Moderate';
    if (hours < 10) return 'Heavy';
    return 'Intensive';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTimeToCompletion = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30);
    
    if (diffMonths > 12) {
      const years = Math.ceil(diffMonths / 12);
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (diffMonths > 1) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else if (diffWeeks > 1) {
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const change = getCommitmentChange();

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">What-If Explorer</span>
          <span className="text-xs text-slate-500">Adjust commitment</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {simulatedCompletionDate ? formatDate(simulatedCompletionDate) : 'Complete'}
          </span>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Current vs Simulated */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-slate-700">Current Commitment</div>
                <div className="text-xs text-slate-500">{currentWeeklyHours.toFixed(1)}h/week</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-700">Simulated</div>
                <div className="text-xs text-slate-500">{simulatedWeeklyHours.toFixed(1)}h/week</div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>0h</span>
                <span className="font-medium">{getCommitmentLabel(simulatedWeeklyHours)}</span>
                <span>20h</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={simulatedWeeklyHours}
                onChange={(e) => setSimulatedWeeklyHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${(simulatedWeeklyHours / 20) * 100}%, #E2E8F0 ${(simulatedWeeklyHours / 20) * 100}%, #E2E8F0 100%)`
                }}
              />
            </div>

            {/* Results */}
            {simulatedCompletionDate && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold text-slate-800 mb-1">
                    {simulatedCompletionDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-slate-600">
                    {getTimeToCompletion(simulatedCompletionDate)} from now
                  </div>
                </div>

                {/* Change indicators */}
                {Math.abs(change.value) > 0.1 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">
                      {change.value > 0 ? 'Accelerate by' : 'Slow down by'}
                    </div>
                    <div className="text-sm font-bold text-blue-900">
                      {Math.abs(change.value).toFixed(1)}h/week
                      <span className="text-xs ml-1">
                        ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Action suggestions */}
                <div className="text-xs text-slate-600 space-y-1">
                  {simulatedWeeklyHours > currentWeeklyHours && (
                    <div className="p-2 bg-green-50 rounded text-green-800">
                      💡 <strong>To accelerate:</strong> Add {Math.ceil((simulatedWeeklyHours - currentWeeklyHours) * 60)} minutes to your weekly routine
                    </div>
                  )}
                  {simulatedWeeklyHours < currentWeeklyHours && (
                    <div className="p-2 bg-yellow-50 rounded text-yellow-800">
                      ⚠️ <strong>Slower pace:</strong> This reduces your weekly commitment by {Math.abs(change.value).toFixed(1)} hours
                    </div>
                  )}
                  {Math.abs(change.value) < 0.5 && (
                    <div className="p-2 bg-blue-50 rounded text-blue-800">
                      ✅ <strong>Steady pace:</strong> Your current commitment is well-balanced
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reset button */}
            <button
              onClick={() => setSimulatedWeeklyHours(currentWeeklyHours)}
              className="w-full py-2 px-3 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors duration-200"
            >
              Reset to current
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


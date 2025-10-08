'use client';

import { useState, useEffect, useCallback } from 'react';
import { Goal, TimeLog, VelocityData, SessionQuality, MilestonePacing } from '@/types';
import { calculateVelocityData, calculateSessionQuality, calculateMilestonePacing, calculateMomentumScore } from '@/utils/velocityUtils';
import WeeklyVelocitySparkline from './WeeklyVelocitySparkline';
import ConsistencyStreak from './ConsistencyStreak';
import MomentumScore from './MomentumScore';
import WhatIfExplorer from './WhatIfExplorer';
import MilestonePacingComponent from './MilestonePacing';
import SessionQualityNotes from './SessionQualityNotes';

interface VelocityInsightsProps {
  goal: Goal;
  timeLogs: TimeLog[];
  activityColor?: string;
  className?: string;
}

export default function VelocityInsights({ 
  goal, 
  timeLogs, 
  activityColor = '#4F46E5',
  className = '' 
}: VelocityInsightsProps) {
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [sessionQuality, setSessionQuality] = useState<SessionQuality | null>(null);
  const [milestonePacing, setMilestonePacing] = useState<MilestonePacing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Calculate velocity data
      const velocity = calculateVelocityData({
        id: goal.id,
        targetHours: goal.targetHours,
        createdAt: goal.createdAt,
        activityIds: goal.activityIds
      }, timeLogs);
      setVelocityData(velocity);

      // Calculate session quality
      const quality = calculateSessionQuality(timeLogs, goal.activityIds ?? [], velocity.weeklyData);
      setSessionQuality(quality);

      // Calculate milestone pacing (no target date for now)
      const pacing = calculateMilestonePacing({
        id: goal.id,
        targetHours: goal.targetHours,
        createdAt: goal.createdAt,
        activityIds: goal.activityIds,
        targetDate: goal.targetDate
      }, timeLogs);
      setMilestonePacing(pacing);

    } catch (error) {
      console.error('Error calculating velocity insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [goal, timeLogs]);

  useEffect(() => {
    calculateInsights();
  }, [calculateInsights]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-slate-600">Calculating insights...</span>
        </div>
      </div>
    );
  }

  if (!velocityData || velocityData.weeklyData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-xs text-slate-500">
            Start logging time to see velocity insights and trends.
          </div>
        </div>
      </div>
    );
  }

  const currentWeeklyHours = velocityData.weeklyData.length > 0 
    ? velocityData.weeklyData.slice(-4).reduce((sum, week) => sum + week.hours, 0) / Math.min(4, velocityData.weeklyData.length)
    : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="text-xs text-slate-500">
          {velocityData.weeklyData.length} weeks of data
        </div>
      </div>

      {/* Main insights grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6">
        {/* Left column - Charts and trends */}
        <div className="space-y-4">
          {/* Weekly velocity sparkline */}
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <WeeklyVelocitySparkline
              data={velocityData.weeklyData}
              averageSlope={velocityData.averageSlope}
              color={activityColor}
            />
          </div>

          {/* Consistency streak */}
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <ConsistencyStreak
              streakData={{
                current: velocityData.currentStreak,
                longest: velocityData.longestStreak,
                lastMiss: velocityData.lastMissWeek,
                minimumSessions: 2
              }}
            />
          </div>

          {/* Momentum score */}
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <MomentumScore
              momentumScore={calculateMomentumScore(velocityData.weeklyData)}
            />
          </div>
        </div>

        {/* Right column - Tools and analysis */}
        <div className="space-y-4">
          {/* What-if explorer */}
          <WhatIfExplorer
            goal={goal}
            timeLogs={timeLogs}
            currentWeeklyHours={currentWeeklyHours}
          />

          {/* Milestone pacing */}
          {milestonePacing && (
            <MilestonePacingComponent
              milestonePacing={milestonePacing}
            />
          )}

          {/* Session quality notes */}
          {sessionQuality && (
            <SessionQualityNotes
              sessionQuality={sessionQuality}
            />
          )}
        </div>
      </div>

      {/* Summary insights */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 mx-6">
        <div className="text-sm font-semibold text-indigo-800 mb-2">Key Insights</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-indigo-600 font-medium">Weekly Trend</div>
            <div className="text-slate-700">
              {velocityData.averageSlope > 0 ? '↗️ Accelerating' : 
               velocityData.averageSlope < 0 ? '↘️ Slowing down' : '→ Steady pace'}
            </div>
          </div>
          <div>
            <div className="text-indigo-600 font-medium">Consistency</div>
            <div className="text-slate-700">
              {velocityData.currentStreak >= 4 ? '🔥 Strong streak' :
               velocityData.currentStreak >= 2 ? '💪 Building habit' : '📅 Getting started'}
            </div>
          </div>
          <div>
            <div className="text-indigo-600 font-medium">Momentum</div>
            <div className="text-slate-700">
              {velocityData.momentumScore >= 80 ? '🚀 High momentum' :
               velocityData.momentumScore >= 60 ? '⚡ Good momentum' : '🔄 Building momentum'}
            </div>
          </div>
        </div>
      </div>

      {/* Action recommendations */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mx-6 mb-6">
        <div className="text-sm font-semibold text-amber-800 mb-2">💡 Recommendations</div>
        <div className="text-xs text-amber-700 space-y-1">
          {velocityData.averageSlope < 0 && (
            <div>• Your weekly pace is declining - consider setting smaller daily goals</div>
          )}
          {velocityData.currentStreak === 0 && (
            <div>• Start with 2-3 sessions per week to build consistency</div>
          )}
          {velocityData.momentumScore < 50 && (
            <div>• Focus on consistency over intensity to build momentum</div>
          )}
          {velocityData.averageSlope > 1 && (
            <div>• Great acceleration! Keep up the excellent progress</div>
          )}
          {velocityData.currentStreak >= 8 && (
            <div>• Outstanding consistency! Consider increasing your weekly target</div>
          )}
        </div>
      </div>
    </div>
  );
}


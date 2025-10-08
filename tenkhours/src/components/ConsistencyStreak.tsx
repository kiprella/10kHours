'use client';

import { useState } from 'react';
import { StreakData } from '@/types';

interface ConsistencyStreakProps {
  streakData: StreakData;
  className?: string;
}

export default function ConsistencyStreak({ 
  streakData, 
  className = '' 
}: ConsistencyStreakProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStreakColor = (streak: number) => {
    if (streak >= 8) return 'text-green-600 bg-green-100 border-green-200';
    if (streak >= 4) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (streak >= 2) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-slate-600 bg-slate-100 border-slate-200';
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 8) return '🔥';
    if (streak >= 4) return '⚡';
    if (streak >= 2) return '💪';
    return '📅';
  };

  const formatStreakText = (streak: number) => {
    if (streak === 0) return 'No streak';
    if (streak === 1) return '1 week';
    return `${streak} weeks`;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Current streak badge */}
        <div 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${getStreakColor(streakData.current)}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="mr-1">{getStreakIcon(streakData.current)}</span>
          <span>Current: {formatStreakText(streakData.current)}</span>
        </div>

        {/* Longest streak indicator */}
        {streakData.longest > streakData.current && (
          <div className="text-xs text-slate-500">
            Best: {formatStreakText(streakData.longest)}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 z-10 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg min-w-48">
          <div className="font-semibold mb-1">Consistency Details</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-300">Current streak:</span>
              <span className="font-medium">{formatStreakText(streakData.current)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Longest streak:</span>
              <span className="font-medium">{formatStreakText(streakData.longest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Minimum target:</span>
              <span className="font-medium">{streakData.minimumSessions} sessions/week</span>
            </div>
            {streakData.lastMiss && (
              <div className="flex justify-between">
                <span className="text-slate-300">Last miss:</span>
                <span className="font-medium">{streakData.lastMiss}</span>
              </div>
            )}
          </div>
          
          {/* Consistency tips */}
          <div className="mt-2 pt-2 border-t border-slate-600">
            <div className="text-slate-300 text-xs">
              {streakData.current === 0 && "Start with small, consistent sessions to build momentum."}
              {streakData.current > 0 && streakData.current < 4 && "Great start! Keep building that habit."}
              {streakData.current >= 4 && streakData.current < 8 && "Excellent consistency! You're building a strong habit."}
              {streakData.current >= 8 && "Outstanding! You've mastered consistent practice."}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar for streak visualization */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Streak Progress</span>
          <span>{streakData.current} / {Math.max(streakData.longest, 8)} weeks</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              streakData.current >= 8 ? 'bg-green-500' :
              streakData.current >= 4 ? 'bg-blue-500' :
              streakData.current >= 2 ? 'bg-yellow-500' : 'bg-slate-400'
            }`}
            style={{ 
              width: `${Math.min(100, (streakData.current / Math.max(streakData.longest, 8)) * 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}

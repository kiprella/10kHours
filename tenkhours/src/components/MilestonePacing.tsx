'use client';

import { useState } from 'react';
import { MilestonePacing as MilestonePacingType } from '@/types';

interface MilestonePacingProps {
  milestonePacing: MilestonePacingType;
  className?: string;
}

export default function MilestonePacing({ 
  milestonePacing, 
  className = '' 
}: MilestonePacingProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'text-green-600';
    if (gap <= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGapIcon = (gap: number) => {
    if (gap <= 0) return '✅';
    if (gap <= 1) return '⚠️';
    return '🚨';
  };

  const getGapLabel = (gap: number) => {
    if (gap <= 0) return 'On track';
    if (gap <= 1) return 'Slightly behind';
    return 'Behind schedule';
  };


  if (!milestonePacing.targetDate) {
    return (
      <div className={`${className}`}>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-1">Milestone Pacing</div>
          <div className="text-xs text-slate-500">
            No target date set. Set a calendar target to see pacing insights.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div 
        className="p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-700">Milestone Pacing</div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${getGapColor(milestonePacing.gap)}`}>
            <span>{getGapIcon(milestonePacing.gap)}</span>
            <span>{getGapLabel(milestonePacing.gap)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Target date */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Target date:</span>
            <span className="text-xs font-medium text-slate-700">
              {formatDate(milestonePacing.targetDate)}
            </span>
          </div>

          {/* Required vs current */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Required pace:</span>
            <span className="text-xs font-medium text-slate-700">
              {milestonePacing.requiredWeeklyHours.toFixed(1)}h/week
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Your pace:</span>
            <span className="text-xs font-medium text-slate-700">
              {milestonePacing.currentWeeklyHours.toFixed(1)}h/week
            </span>
          </div>

          {/* Gap indicator */}
          {milestonePacing.gap > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Gap:</span>
              <span className={`text-xs font-semibold ${getGapColor(milestonePacing.gap)}`}>
                +{milestonePacing.gap.toFixed(1)}h/week needed
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress to target</span>
            <span>
              {milestonePacing.currentWeeklyHours > 0 && milestonePacing.requiredWeeklyHours > 0
                ? `${Math.min(100, (milestonePacing.currentWeeklyHours / milestonePacing.requiredWeeklyHours) * 100).toFixed(0)}%`
                : milestonePacing.requiredWeeklyHours === 0
                ? 'Target reached'
                : '0%'
              }
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                milestonePacing.isOnTrack ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${milestonePacing.requiredWeeklyHours > 0 
                  ? Math.min(100, (milestonePacing.currentWeeklyHours / milestonePacing.requiredWeeklyHours) * 100)
                  : 100
                }%` 
              }}
            />
          </div>
        </div>

        {/* Detailed breakdown tooltip */}
        {showDetails && (
          <div className="absolute top-full left-0 mt-2 z-10 bg-slate-800 text-white text-xs rounded-lg px-4 py-3 shadow-lg min-w-64">
            <div className="font-semibold mb-2">Pacing Analysis</div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">Target date:</span>
                <span className="font-medium">{formatDate(milestonePacing.targetDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Required pace:</span>
                <span className="font-medium">{milestonePacing.requiredWeeklyHours.toFixed(1)}h/week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Your current pace:</span>
                <span className="font-medium">{milestonePacing.currentWeeklyHours.toFixed(1)}h/week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Gap:</span>
                <span className={`font-medium ${getGapColor(milestonePacing.gap)}`}>
                  {milestonePacing.gap > 0 ? '+' : ''}{milestonePacing.gap.toFixed(1)}h/week
                </span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-3 pt-2 border-t border-slate-600">
              <div className="text-slate-300">
                {milestonePacing.gap <= 0 && "🎉 You're on track to meet your target date!"}
                {milestonePacing.gap > 0 && milestonePacing.gap <= 1 && 
                  `💡 Add ${Math.ceil(milestonePacing.gap * 60)} minutes per week to stay on track.`
                }
                {milestonePacing.gap > 1 && 
                  `🚨 Consider increasing your weekly commitment by ${milestonePacing.gap.toFixed(1)} hours or adjusting your target date.`
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

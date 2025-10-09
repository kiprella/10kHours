'use client';

import { useState, useEffect } from 'react';
import { Goal, GoalAward, GoalAwardData, Activity, TimeLog } from '@/types';
import { calculateGoalAwardData, getAwardMessage } from '@/utils/goalAwards';

interface GoalAwardsProps {
  goal: Goal;
  activities: Activity[];
  timeLogs: TimeLog[];
  existingAwards: GoalAward[];
  onNewAwards?: (awards: GoalAward[]) => void;
  className?: string;
}

export default function GoalAwards({ 
  goal, 
  activities, 
  timeLogs, 
  existingAwards,
  onNewAwards,
  className = '' 
}: GoalAwardsProps) {
  const [awardData, setAwardData] = useState<GoalAwardData | null>(null);
  const [showAllAwards, setShowAllAwards] = useState(false);
  const [newAwards, setNewAwards] = useState<GoalAward[]>([]);

  useEffect(() => {
    const data = calculateGoalAwardData(goal, activities, timeLogs, existingAwards);
    setAwardData(data);
    
    // Check for new milestones that need awards
    const currentProgress = data.awards.length > 0 ? 
      (data.awards[data.awards.length - 1]?.percentage || 0) : 0;
    
    // This is a simplified check - in a real implementation, you'd compare with actual progress
    // For now, we'll just show existing awards
  }, [goal, activities, timeLogs, existingAwards]);

  const formatAwardDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAwardIcon = (percentage: number) => {
    switch (percentage) {
      case 25: return '🎯';
      case 50: return '🔥';
      case 75: return '⚡';
      case 100: return '🏆';
      default: return '🎉';
    }
  };

  const getAwardColor = (percentage: number) => {
    switch (percentage) {
      case 25: return 'bg-blue-50 border-blue-200 text-blue-700';
      case 50: return 'bg-orange-50 border-orange-200 text-orange-700';
      case 75: return 'bg-purple-50 border-purple-200 text-purple-700';
      case 100: return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  if (!awardData || awardData.awards.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-1">Goal Awards</div>
          <div className="text-xs text-slate-500">
            Complete milestones to earn awards! Reach 25%, 50%, 75%, and 100% of your goal.
          </div>
        </div>
      </div>
    );
  }

  const displayedAwards = showAllAwards ? awardData.awards : awardData.awards.slice(-2);
  const hasMoreAwards = awardData.awards.length > 2;

  return (
    <div className={`${className}`}>
      <div className="p-3 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-700">Goal Awards</div>
          {hasMoreAwards && (
            <button
              onClick={() => setShowAllAwards(!showAllAwards)}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {showAllAwards ? 'Show less' : `Show all (${awardData.awards.length})`}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {displayedAwards.map((award) => (
            <div
              key={award.id}
              className={`p-2 rounded-lg border text-xs ${getAwardColor(award.percentage)}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getAwardIcon(award.percentage)}</span>
                <div className="flex-1">
                  <div className="font-semibold">{award.percentage}% Complete</div>
                  <div className="text-xs opacity-75">
                    {formatAwardDate(award.awardedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Next milestone progress */}
          {awardData.nextMilestone && (
            <div className="mt-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Next milestone: {awardData.nextMilestone}%</span>
                <span>{awardData.progressToNext.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${awardData.progressToNext}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion celebration */}
          {awardData.awards.some(award => award.percentage === 100) && (
            <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🎉</span>
                <div>
                  <div className="font-semibold text-green-800">Goal Completed!</div>
                  <div className="text-xs text-green-600">
                    Congratulations on reaching 100% of your goal!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

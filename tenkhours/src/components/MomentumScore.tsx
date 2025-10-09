'use client';

import { useState } from 'react';
import { MomentumScore as MomentumScoreType } from '@/types';

interface MomentumScoreProps {
  momentumScore: MomentumScoreType;
  className?: string;
}

export default function MomentumScore({ 
  momentumScore, 
  className = '' 
}: MomentumScoreProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getMomentumLabel = (score: number, trend: string) => {
    if (score >= 80 && trend === 'rising') return 'Momentum surging';
    if (score >= 80) return 'Momentum strong';
    if (score >= 60 && trend === 'rising') return 'Momentum building';
    if (score >= 60) return 'Momentum steady';
    if (score >= 40 && trend === 'rising') return 'Momentum improving';
    if (score >= 40) return 'Momentum flat';
    if (trend === 'declining') return 'Momentum declining';
    return 'Momentum low';
  };

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change.toFixed(1)}% vs last month`;
    if (change < 0) return `${change.toFixed(1)}% vs last month`;
    return 'Same as last month';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between">
        {/* Momentum score badge */}
        <div 
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-200 ${getScoreColor(momentumScore.score)}`}
          onMouseEnter={() => setShowDetails(true)}
          onMouseLeave={() => setShowDetails(false)}
        >
          <span className="mr-2">{getTrendIcon(momentumScore.trend)}</span>
          <span>{momentumScore.score}/100</span>
        </div>

        {/* Momentum description */}
        <div className="text-right">
          <div className={`text-sm font-medium ${getTrendColor(momentumScore.trend)}`}>
            {getMomentumLabel(momentumScore.score, momentumScore.trend)}
          </div>
          <div className="text-xs text-slate-500">
            {getChangeText(momentumScore.change)}
          </div>
        </div>
      </div>

      {/* Detailed breakdown tooltip */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 z-10 bg-slate-800 text-white text-xs rounded-lg px-4 py-3 shadow-lg min-w-64">
          <div className="font-semibold mb-2">Momentum Breakdown</div>
          
          {/* Score visualization */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Score</span>
              <span className="font-bold">{momentumScore.score}/100</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  momentumScore.score >= 80 ? 'bg-green-500' :
                  momentumScore.score >= 60 ? 'bg-blue-500' :
                  momentumScore.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${momentumScore.score}%` }}
              />
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300">4-week average:</span>
              <span className="font-medium">{momentumScore.factors.rollingAverage}h/week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Consistency:</span>
              <span className="font-medium">{Math.round((100 - momentumScore.factors.standardDeviation * 5))}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Recent growth:</span>
              <span className={`font-medium ${getTrendColor(momentumScore.trend)}`}>
                {momentumScore.factors.recentGrowth > 0 ? '+' : ''}{momentumScore.factors.recentGrowth.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Trend explanation */}
          <div className="mt-3 pt-2 border-t border-slate-600">
            <div className="text-slate-300">
              {momentumScore.trend === 'rising' && "Your practice is accelerating! Keep up the great work."}
              {momentumScore.trend === 'flat' && "Steady progress. Consider increasing intensity or frequency."}
              {momentumScore.trend === 'declining' && "Momentum is slowing. Focus on consistency and smaller goals."}
            </div>
          </div>
        </div>
      )}

      {/* Visual momentum indicator */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-500 ${
              momentumScore.score >= 80 ? 'bg-green-500' :
              momentumScore.score >= 60 ? 'bg-blue-500' :
              momentumScore.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${momentumScore.score}%` }}
          />
        </div>
        <div className={`text-xs font-medium ${getTrendColor(momentumScore.trend)}`}>
          {momentumScore.trend === 'rising' && '↗️'}
          {momentumScore.trend === 'declining' && '↘️'}
          {momentumScore.trend === 'flat' && '→'}
        </div>
      </div>
    </div>
  );
}

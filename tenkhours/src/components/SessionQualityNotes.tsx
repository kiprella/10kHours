'use client';

import { useState } from 'react';
import { SessionQuality } from '@/types';

interface SessionQualityNotesProps {
  sessionQuality: SessionQuality;
  className?: string;
}

export default function SessionQualityNotes({ 
  sessionQuality, 
  className = '' 
}: SessionQualityNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDuration = (minutes: number) => {
    const rounded = Math.round(minutes);
    if (rounded <= 0) return '0m';
    minutes = rounded;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getSessionTypeIcon = (type: 'long' | 'short') => {
    return type === 'long' ? '🔥' : '⚡';
  };

  const getSessionTypeLabel = (type: 'long' | 'short') => {
    return type === 'long' ? 'Long session' : 'Short session';
  };

  const getSessionTypeColor = (type: 'long' | 'short') => {
    return type === 'long' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100';
  };

  const getFocusRatio = () => {
    if (sessionQuality.focusDayAverage === 0 && sessionQuality.nonFocusDayAverage === 0) return 0;
    const total = sessionQuality.focusDayAverage + sessionQuality.nonFocusDayAverage;
    return (sessionQuality.focusDayAverage / total) * 100;
  };

  const getQualityInsight = () => {
    const focusRatio = getFocusRatio();
    const avgLength = sessionQuality.averageSessionLength;
    
    if (focusRatio > 70 && avgLength > 60) {
      return "🎯 Excellent focus and session length! You're maximizing your practice time.";
    } else if (focusRatio > 50 && avgLength > 45) {
      return "👍 Good balance of focused and flexible practice sessions.";
    } else if (focusRatio < 30) {
      return "💡 Consider adding more focused practice days to improve consistency.";
    } else if (avgLength < 30) {
      return "⏰ Try extending your session length for deeper practice.";
    } else {
      return "📊 Your practice patterns show room for optimization.";
    }
  };

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Session Quality</span>
          <span className="text-xs text-slate-500">Insights & patterns</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {formatDuration(sessionQuality.averageSessionLength)} avg
          </span>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Quality insight */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              {getQualityInsight()}
            </div>
          </div>

          {/* Session statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Average Session</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatDuration(sessionQuality.averageSessionLength)}
              </div>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Focus Days</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatDuration(sessionQuality.focusDayAverage)}
              </div>
            </div>
          </div>

          {/* Best week highlight */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-800">Best Week</div>
              <div className="text-xs text-green-600">{sessionQuality.bestWeek.week}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-green-600">
                {sessionQuality.bestWeek.hours}h • {sessionQuality.bestWeek.sessions} sessions
              </div>
              <div className="text-xs text-green-600">
                {sessionQuality.bestWeek.sessions > 0 
                  ? formatDuration(sessionQuality.bestWeek.hours * 60 / sessionQuality.bestWeek.sessions)
                  : '0m'
                } avg
              </div>
            </div>
          </div>

          {/* Unusual sessions */}
          {sessionQuality.unusualSessions.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Notable Sessions</div>
              <div className="space-y-1">
                {sessionQuality.unusualSessions.slice(0, 3).map((session, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded text-xs ${getSessionTypeColor(session.type)}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getSessionTypeIcon(session.type)}</span>
                      <span className="font-medium">{getSessionTypeLabel(session.type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatDuration(session.duration)}</span>
                      <span className="text-slate-500">{session.date}</span>
                    </div>
                  </div>
                ))}
                {sessionQuality.unusualSessions.length > 3 && (
                  <div className="text-xs text-slate-500 text-center py-1">
                    +{sessionQuality.unusualSessions.length - 3} more unusual sessions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Focus vs non-focus comparison */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium text-slate-700 mb-2">Focus Analysis</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Focus days (2+ sessions):</span>
                <span className="text-xs font-medium text-slate-800">
                  {formatDuration(sessionQuality.focusDayAverage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Regular days:</span>
                <span className="text-xs font-medium text-slate-800">
                  {formatDuration(sessionQuality.nonFocusDayAverage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Focus ratio:</span>
                <span className="text-xs font-medium text-slate-800">
                  {getFocusRatio().toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm font-medium text-amber-800 mb-2">💡 Recommendations</div>
            <div className="text-xs text-amber-700 space-y-1">
              {sessionQuality.averageSessionLength < 30 && (
                <div>• Try extending sessions to 45+ minutes for deeper practice</div>
              )}
              {getFocusRatio() < 40 && (
                <div>• Schedule 2-3 focused practice days per week</div>
              )}
              {sessionQuality.unusualSessions.length > 5 && (
                <div>• Consider more consistent session lengths</div>
              )}
              {sessionQuality.averageSessionLength > 90 && getFocusRatio() > 60 && (
                <div>• Great consistency! Consider adding variety to prevent burnout</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { WeeklyVelocityData } from '@/types';

interface WeeklyVelocitySparklineProps {
  data: WeeklyVelocityData[];
  averageSlope: number;
  color?: string;
  className?: string;
}

export default function WeeklyVelocitySparkline({ 
  data, 
  averageSlope, 
  color = '#4F46E5',
  className = ''
}: WeeklyVelocitySparklineProps) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-12 text-xs text-slate-400 ${className}`}>
        No data yet
      </div>
    );
  }

  // Normalize data for chart display
  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const minHours = Math.min(...data.map(d => d.hours));
  const range = maxHours - minHours || 1;

  // Create SVG path
  const width = 120;
  const height = 40;
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const points = data.map((week, index) => {
    // Handle single data point case
    const x = data.length === 1 
      ? padding + chartWidth / 2  // Center the single point
      : padding + (index / (data.length - 1)) * chartWidth;
    const normalizedY = range > 0 ? (week.hours - minHours) / range : 0.5;
    const y = padding + chartHeight - (normalizedY * chartHeight);
    return `${x},${y}`;
  }).join(' ');

  // Create area path for fill
  const areaPath = `M ${points.split(' ')[0]} L ${points} L ${points.split(' ')[points.split(' ').length - 1].split(',')[0]},${padding + chartHeight} Z`;

  // Determine slope color
  const slopeColor = averageSlope > 0 ? '#10B981' : averageSlope < 0 ? '#EF4444' : '#6B7280';

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-600">Weekly Velocity</span>
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: slopeColor }}
          />
          <span className="text-xs font-semibold" style={{ color: slopeColor }}>
            {averageSlope > 0 ? '+' : ''}{averageSlope.toFixed(1)}h/week
          </span>
        </div>
      </div>
      
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((week, index) => {
            // Handle single data point case for circles
            const x = data.length === 1 
              ? padding + chartWidth / 2  // Center the single point
              : padding + (index / (data.length - 1)) * chartWidth;
            const normalizedY = range > 0 ? (week.hours - minHours) / range : 0.5;
            const y = padding + chartHeight - (normalizedY * chartHeight);
            
            return (
              <circle
                key={week.week}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="hover:r-3 transition-all duration-200"
              />
            );
          })}
        </svg>
        
        {/* Tooltip on hover */}
        <div className="absolute inset-0 pointer-events-none">
          {data.map((week, index) => {
            // Handle single data point case for tooltips
            const x = data.length === 1 
              ? padding + chartWidth / 2  // Center the single point
              : padding + (index / (data.length - 1)) * chartWidth;
            const normalizedY = range > 0 ? (week.hours - minHours) / range : 0.5;
            const y = padding + chartHeight - (normalizedY * chartHeight);
            
            return (
              <div
                key={week.week}
                className="absolute pointer-events-auto group"
                style={{ 
                  left: x - 20, 
                  top: y - 30,
                  width: 40,
                  height: 20
                }}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div className="font-semibold">{week.hours}h</div>
                  <div className="text-slate-300">{week.sessions} sessions</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Week labels */}
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{data[0]?.week || ''}</span>
        <span>{data[data.length - 1]?.week || ''}</span>
      </div>
    </div>
  );
}

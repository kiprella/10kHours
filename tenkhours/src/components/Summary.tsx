import { useState, useEffect, useMemo, useCallback } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import { getTimeLogSummary } from '@/utils/timeLogUtils';
import { getPalette } from '@/utils/activityColors';
import { getActivities, getValidatedTimeLogs } from '@/utils/storage';
import { Activity, TimeLog } from '@/types';

// Helper function to get primary activity ID from a time log
const getPrimaryActivityId = (log: TimeLog): string =>
  log.activityIds?.[0] ?? log.activityId ?? '';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Place months array at top-level scope for reuse
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function Summary() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{ [key: string]: { [activityId: string]: number } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [pieView, setPieView] = useState<'year' | 'month'>('year');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(new Date().getMonth());
  const [selectedTag, setSelectedTag] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const activitiesData = await getActivities();
      setActivities(activitiesData);

      const summary = await getTimeLogSummary();
      const logs = await getValidatedTimeLogs();
      setTimeLogs(logs);

      const years = new Set<number>();
      summary.monthlyData.forEach(data => {
        const [year] = data.month.split('-');
        years.add(parseInt(year));
      });
      if (!years.has(selectedYear)) {
        years.add(selectedYear);
      }
      setAvailableYears(Array.from(years).sort((a, b) => b - a));

      const breakdown: { [key: string]: { [activityId: string]: number } } = {};
      for (let i = 0; i < 12; i++) {
        const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
        breakdown[monthKey] = {};
        const logsForMonth = logs.filter(log => {
          const date = new Date(log.timestamp);
          return date.getFullYear() === selectedYear && date.getMonth() === i;
        });
        activitiesData.forEach(activity => {
          const totalMinutes = logsForMonth
            .filter(log => getPrimaryActivityId(log) === activity.id)
            .reduce((sum, log) => sum + log.duration, 0);
          if (totalMinutes > 0) {
            breakdown[monthKey][activity.id] = totalMinutes;
          }
        });
      }

      setMonthlyBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading summary data:', error);
      setError('Failed to load summary data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('timeLogUpdated', handleUpdate);
    return () => {
      window.removeEventListener('timeLogUpdated', handleUpdate);
    };
  }, [loadData]);

  // Get all unique activity names for filtering
  const allActivityNames = useMemo(() => {
    return activities.map(a => a.name);
  }, [activities]);

  // Filter activities by selected name
  const filteredActivities = useMemo(() => {
    if (!selectedTag) return activities;
    return activities.filter(a => a.name === selectedTag);
  }, [activities, selectedTag]);

  // Filter logs for charts by selected activity name
  const filteredTimeLogs = useMemo(() => {
    if (!selectedTag) return timeLogs;
    const filteredIds = new Set(filteredActivities.map(a => a.id));
    return timeLogs.filter(log => filteredIds.has(getPrimaryActivityId(log)));
  }, [timeLogs, filteredActivities, selectedTag]);

  // --- Monthly Hours (Line Chart) Calculation ---
  const filteredMonthlyHours = useMemo(() => {
    // For each month, sum hours for filtered logs
    return months.map((month, idx) => {
      const monthKey = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      // Filter logs for this month
      const logsForMonth = filteredTimeLogs.filter(log => {
        const date = new Date(log.timestamp);
        return date.getFullYear() === selectedYear && date.getMonth() === idx;
      });
      // Only count logs for filtered activities
      const filteredIds = new Set(filteredActivities.map(a => a.id));
      const minutes = logsForMonth.filter(log => filteredIds.has(getPrimaryActivityId(log))).reduce((sum, log) => sum + log.duration, 0);
      return {
        month,
        monthKey,
        hours: minutes / 60,
      };
    });
  }, [filteredTimeLogs, filteredActivities, selectedYear]);

  // --- Total Focus Time Calculation ---
  const filteredTotalMinutes = useMemo(() => {
    return filteredTimeLogs.reduce((sum, log) => sum + log.duration, 0);
  }, [filteredTimeLogs]);

  // --- Line Chart Data ---
  const lineChartData = {
    labels: filteredMonthlyHours.map(d => d.month),
    datasets: [
      {
        label: 'Hours',
        data: filteredMonthlyHours.map(d => d.hours),
        borderColor: selectedTag && filteredActivities.length > 0 ? filteredActivities[0].color : '#4F46E5',
        backgroundColor: selectedTag && filteredActivities.length > 0 ? filteredActivities[0].color : '#4F46E5',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: selectedTag && filteredActivities.length > 0 ? filteredActivities[0].color : '#4F46E5',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const idx = context.dataIndex;
            const monthKey = filteredMonthlyHours[idx]?.monthKey;
            const breakdown = monthlyBreakdown[monthKey];
            if (!breakdown) {
              return `Total: ${Number(context.raw).toFixed(2)}H`;
            }
            const labels = [`Total: ${Number(context.raw).toFixed(2)}H`];
            activities.forEach(activity => {
              const minutes = breakdown[activity.id] || 0;
              if (minutes > 0) {
                const hours = minutes / 60;
                labels.push(`${activity.name}: ${hours.toFixed(2)}h`);
              }
            });
            return labels;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: number | string) {
            const value = Number(tickValue);
            return isNaN(value) ? tickValue : `${value.toFixed(2)}H`;
          },
        },
        grid: {
          color: '#E2E8F0',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  } as const;

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Use activity colors for pie chart
  const fallbackPalette = useMemo(() => getPalette(), []);

  const pieColors = filteredActivities.map((activity, index) => {
    if (activity.color) {
      return activity.color;
    }
    return fallbackPalette[index % fallbackPalette.length] || '#4F46E5';
  });

  // --- PIE CHART DATA FILTERING ---
  // Get filtered logs for pie chart
  const pieLogs = useMemo(() => {
    if (pieView === 'year') {
      return filteredTimeLogs.filter(log => {
        const date = new Date(log.timestamp);
        return date.getFullYear() === selectedYear;
      });
    } else {
      return filteredTimeLogs.filter(log => {
        const date = new Date(log.timestamp);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIdx;
      });
    }
  }, [pieView, selectedYear, selectedMonthIdx, filteredTimeLogs]);

  const pieActivityMinutes = useMemo(() => {
    const result: { [activityId: string]: number } = {};
    filteredActivities.forEach(activity => {
      result[activity.id] = 0;
    });
    pieLogs.forEach(log => {
      const activityId = getPrimaryActivityId(log);
      if (result[activityId] !== undefined) {
        result[activityId] += log.duration;
      }
    });
    return result;
  }, [filteredActivities, pieLogs]);

  const pieChartData = {
    labels: filteredActivities.map(a => `${a.name} (${formatTime(pieActivityMinutes[a.id] || 0)})`),
    datasets: [
      {
        data: filteredActivities.map(a => pieActivityMinutes[a.id] || 0),
        backgroundColor: pieColors,
        borderWidth: 0,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const label = context.label || '';
            
            // Guard against division by zero when no time is logged
            if (total === 0) {
              return `${label} (No data)`;
            }
            
            const percentage = ((value / total) * 100).toFixed(0);
            return `${label} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tag Filter */}
      <div className="flex justify-end">
        <select
          className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700"
          value={selectedTag}
          onChange={e => setSelectedTag(e.target.value)}
        >
          <option value="">All Activities</option>
          {allActivityNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Total Focus Time */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Focus Time</h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">
              {Math.floor(filteredTotalMinutes / 60)}
              <span className="text-2xl ml-1">Hours</span>
            </div>
            <div className="text-slate-600 mt-1">
              {filteredTotalMinutes % 60}
              <span className="ml-1">Minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Monthly Progress</h3>
          <div className="flex space-x-2">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-lg ${
                  selectedYear === year
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Activity Distribution</h3>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded-lg ${pieView === 'year' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setPieView('year')}
            >
              Year
            </button>
            <button
              className={`px-3 py-1 rounded-lg ${pieView === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setPieView('month')}
            >
              Month
            </button>
            {pieView === 'month' && (
              <select
                className="ml-2 px-2 py-1 rounded border border-slate-300 bg-white text-slate-700"
                value={selectedMonthIdx}
                onChange={e => setSelectedMonthIdx(Number(e.target.value))}
              >
                {months.map((m: string, idx: number) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="h-64">
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>
    </div>
  );
} 






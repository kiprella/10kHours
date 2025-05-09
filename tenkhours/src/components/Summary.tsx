import { useState, useEffect, useMemo } from 'react';
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
} from 'chart.js';
import { getTimeLogSummary } from '@/utils/timeLogUtils';
import { getActivities, getTimeLogs } from '@/utils/storage';
import { Activity, TimeLog } from '@/types';

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
  const [monthlyHours, setMonthlyHours] = useState<{ month: string; monthKey: string; hours: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{ [key: string]: { [activityId: string]: number } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [pieView, setPieView] = useState<'year' | 'month'>('year');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(new Date().getMonth());

  const activityMinutesForYear = useMemo(() => {
    const result: { [activityId: string]: number } = {};
    activities.forEach(activity => {
      result[activity.id] = 0;
    });
    timeLogs.forEach(log => {
      const date = new Date(log.timestamp);
      if (date.getFullYear() === selectedYear) {
        if (result[log.activityId] !== undefined) {
          result[log.activityId] += log.duration;
        }
      }
    });
    return result;
  }, [activities, timeLogs, selectedYear]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const activitiesData = await getActivities();
        setActivities(activitiesData);

        const summary = await getTimeLogSummary();
        const logs = await getTimeLogs();
        setTimeLogs(logs);

        // Extract unique years from the data
        const years = new Set<number>();
        summary.monthlyData.forEach(data => {
          const [year] = data.month.split('-');
          years.add(parseInt(year));
        });
        // If no data exists for current year, add it to available years
        if (!years.has(selectedYear)) {
          years.add(selectedYear);
        }
        setAvailableYears(Array.from(years).sort((a, b) => b - a));

        // Initialize all months with 0 hours
        const monthlyData = months.map((month, idx) => {
          const monthKey = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
          const found = summary.monthlyData.find(m => m.month === monthKey);
          return {
            month,
            monthKey,
            hours: found ? found.minutes / 60 : 0
          };
        });

        // Per-month, per-activity breakdown
        const breakdown: { [key: string]: { [activityId: string]: number } } = {};
        for (let i = 0; i < 12; i++) {
          const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
          breakdown[monthKey] = {};
          // Filter logs for this month
          const logsForMonth = logs.filter(log => {
            const date = new Date(log.timestamp);
            return date.getFullYear() === selectedYear && date.getMonth() === i;
          });
          activitiesData.forEach(activity => {
            const totalMinutes = logsForMonth
              .filter(log => log.activityId === activity.id)
              .reduce((sum, log) => sum + log.duration, 0);
            if (totalMinutes > 0) {
              breakdown[monthKey][activity.id] = totalMinutes;
            }
          });
        }

        setMonthlyHours(monthlyData);
        setMonthlyBreakdown(breakdown);
        setTotalMinutes(summary.totalMinutes);
      } catch (error) {
        console.error('Error loading summary data:', error);
        setError('Failed to load summary data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedYear]);

  const lineChartData = {
    labels: monthlyHours.map(d => d.month),
    datasets: [
      {
        label: 'Hours',
        data: monthlyHours.map(d => d.hours),
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#4F46E5',
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
          label: (context: any) => {
            const idx = context.dataIndex;
            const monthKey = monthlyHours[idx]?.monthKey;
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

  // Generate a color palette for as many activities as needed
  function generateColorPalette(n: number) {
    const baseColors = [
      '#4F46E5', // Indigo
      '#10B981', // Emerald
      '#64748B', // Slate
      '#8B5CF6', // Violet
      '#F59E42', // Orange
      '#F43F5E', // Rose
      '#FBBF24', // Amber
      '#22D3EE', // Cyan
      '#A3E635', // Lime
      '#E879F9', // Pink
      '#F472B6', // Fuchsia
      '#60A5FA', // Blue
      '#34D399', // Green
      '#F87171', // Red
      '#FCD34D', // Yellow
      '#C084FC', // Purple
    ];
    if (n <= baseColors.length) return baseColors.slice(0, n);
    // Generate more colors if needed
    const colors = [...baseColors];
    for (let i = baseColors.length; i < n; i++) {
      // Generate HSL colors spaced around the color wheel
      const hue = Math.round((i * 360) / n);
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  }
  const pieColors = generateColorPalette(activities.length);

  // --- PIE CHART DATA FILTERING ---
  // Get filtered logs for pie chart
  const pieLogs = useMemo(() => {
    if (pieView === 'year') {
      return timeLogs.filter(log => {
        const date = new Date(log.timestamp);
        return date.getFullYear() === selectedYear;
      });
    } else {
      return timeLogs.filter(log => {
        const date = new Date(log.timestamp);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIdx;
      });
    }
  }, [pieView, selectedYear, selectedMonthIdx, timeLogs]);

  const pieActivityMinutes = useMemo(() => {
    const result: { [activityId: string]: number } = {};
    activities.forEach(activity => {
      result[activity.id] = 0;
    });
    pieLogs.forEach(log => {
      if (result[log.activityId] !== undefined) {
        result[log.activityId] += log.duration;
      }
    });
    return result;
  }, [activities, pieLogs]);

  const pieChartData = {
    labels: activities.map(a => `${a.name} (${formatTime(pieActivityMinutes[a.id] || 0)})`),
    datasets: [
      {
        data: activities.map(a => pieActivityMinutes[a.id] || 0),
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
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            const label = context.label || '';
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
      {/* Total Focus Time */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Focus Time</h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">
              {Math.floor(totalMinutes / 60)}
              <span className="text-2xl ml-1">Hours</span>
            </div>
            <div className="text-slate-600 mt-1">
              {totalMinutes % 60}
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
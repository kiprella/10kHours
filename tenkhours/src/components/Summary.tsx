import { useState, useEffect } from 'react';
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

export default function Summary() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [monthlyHours, setMonthlyHours] = useState<{ month: string; hours: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{ [key: string]: { [activityId: string]: number } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const activitiesData = await getActivities();
        setActivities(activitiesData);

        const summary = await getTimeLogSummary();
        
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
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const monthlyData = months.map(month => ({
          month,
          hours: 0
        }));

        // Get current month and year
        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();

        // Use the same logic as pie chart and summary - just use activities' totalTime
        if (selectedYear === currentDate.getFullYear()) {
          const totalMinutes = activitiesData.reduce((sum, activity) => sum + activity.totalTime, 0);
          monthlyData[currentMonthIndex].hours = totalMinutes / 60;
        }

        // For tooltips, use the same data
        const breakdown: { [key: string]: { [activityId: string]: number } } = {};
        const currentMonth = months[currentMonthIndex];
        const key = `${selectedYear}-${currentMonth}`;
        
        breakdown[key] = {};
        activitiesData.forEach(activity => {
          if (activity.totalTime > 0) {
            breakdown[key][activity.id] = activity.totalTime;
          }
        });
        
        setMonthlyHours(monthlyData);
        setMonthlyBreakdown(breakdown);
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
            const monthKey = `${selectedYear}-${context.label}`;
            const breakdown = monthlyBreakdown[monthKey];
            
            if (!breakdown) {
              return `Total: ${Number(context.raw).toFixed(2)}H`;
            }
            
            const labels = [`Total: ${Number(context.raw).toFixed(2)}H`];
            
            // Add breakdown by activity
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

  const pieChartData = {
    labels: activities.map(a => a.name),
    datasets: [
      {
        data: activities.map(a => a.totalTime),
        backgroundColor: [
          '#4F46E5', // Indigo
          '#10B981', // Emerald
          '#64748B', // Slate
          '#8B5CF6', // Violet
        ],
        borderWidth: 0,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${percentage}%`;
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
              {activities.reduce((total, activity) => {
                return total + activity.totalTime;
              }, 0) >= 60 ? Math.floor(activities.reduce((total, activity) => total + activity.totalTime, 0) / 60) : 0}
              <span className="text-2xl ml-1">Hours</span>
            </div>
            <div className="text-slate-600 mt-1">
              {activities.reduce((total, activity) => total + activity.totalTime, 0) % 60}
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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Activity Distribution</h3>
        <div className="h-64">
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>
    </div>
  );
} 
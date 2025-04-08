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
import { getActivities } from '@/utils/storage';
import { Activity } from '@/types';

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

  useEffect(() => {
    const loadData = async () => {
      const activitiesData = await getActivities();
      setActivities(activitiesData);

      // Mock monthly data for the line chart
      setMonthlyHours([
        { month: 'Jan', hours: 34 },
        { month: 'Feb', hours: 19 },
        { month: 'Mar', hours: 26 },
        { month: 'Apr', hours: 9 },
        { month: 'May', hours: 0 },
        { month: 'Jun', hours: 0 },
        { month: 'Jul', hours: 0 },
        { month: 'Aug', hours: 0 },
        { month: 'Sep', hours: 0 },
        { month: 'Oct', hours: 0 },
        { month: 'Nov', hours: 0 },
        { month: 'Dec', hours: 0 },
      ]);
    };
    loadData();
  }, []);

  const lineChartData = {
    labels: monthlyHours.map(d => d.month),
    datasets: [
      {
        label: 'Hours',
        data: monthlyHours.map(d => d.hours),
        borderColor: '#FFB443',
        backgroundColor: '#FFB443',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#FFB443',
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
          label: (context: any) => `${context.raw}H`,
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
            return isNaN(value) ? tickValue : `${value}H`;
          },
        },
        grid: {
          color: '#E5E7EB',
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
          '#4F46E5', 
          '#34D399', 
          '#60A5FA', 
          '#6B7280', 
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

  return (
    <div className="space-y-8">
      {/* Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
        <div className="h-64">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
        <div className="flex">
          <div className="w-1/2 h-64">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
          <div className="w-1/2 pl-8 space-y-2">
            {activities.map((activity, index) => {
              const total = activities.reduce((sum, a) => sum + a.totalTime, 0);
              const percentage = ((activity.totalTime / total) * 100).toFixed(0);
              const hours = Math.floor(activity.totalTime / 60);
              const minutes = activity.totalTime % 60;
              
              return (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[index] }}
                    />
                    <span>{activity.name}</span>
                  </div>
                  <span className="text-gray-600">
                    {hours}Hrs {minutes}Mins ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 
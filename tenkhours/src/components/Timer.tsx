import { useState, useEffect } from 'react';
import { Activity, TimeLog, TimerSettings } from '@/types';
import { saveTimeLog } from '@/utils/storage';

interface TimerProps {
  settings: TimerSettings;
  activity: Activity;
  onComplete: () => void;
}

export default function Timer({ settings, activity, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60); // Convert minutes to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    const timeLog: TimeLog = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      duration: settings.focusDuration,
      timestamp: Date.now(),
    };

    try {
      await saveTimeLog(timeLog);
      onComplete();
    } catch (error) {
      console.error('Error saving time log:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
      <div className="text-xl">{activity.name}</div>
      <div className="space-x-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setTimeLeft(settings.focusDuration * 60);
            setIsRunning(false);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      {isCompleted && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          Focus session completed! Great job!
        </div>
      )}
    </div>
  );
} 
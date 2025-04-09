import { useState, useEffect, useRef } from 'react';
import { Activity, TimeLog, TimerSettings } from '@/types';
import { saveTimeLog } from '@/utils/storage';

interface TimerProps {
  settings: TimerSettings;
  activity: Activity;
  onComplete: () => void;
}

export default function Timer({ settings, activity, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(settings.focusDuration * 60 * 1000);

  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (!startTimeRef.current || !isRunning) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const remaining = Math.max(0, targetTimeRef.current - elapsed);
      const remainingSeconds = Math.ceil(remaining / 1000);

      setTimeLeft(remainingSeconds);

      if (remaining <= 0) {
        setIsRunning(false);
        setIsCompleted(true);
        handleComplete();
      } else {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning]);

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

  const handleStartPause = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(settings.focusDuration * 60);
    setIsRunning(false);
    startTimeRef.current = null;
    targetTimeRef.current = settings.focusDuration * 60 * 1000;
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
      <div className="text-xl">{activity.name}</div>
      <div className="space-x-4">
        <button
          onClick={handleStartPause}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
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
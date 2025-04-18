import { useState, useEffect, useRef } from 'react';
import { Activity, TimeLog, TimerSettings } from '@/types';

interface TimerProps {
  settings: TimerSettings;
  activity: Activity;
  onComplete: (duration: number) => void;
}

export default function Timer({ settings, activity, onComplete }: TimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(settings.focusDuration);
  const [timeLeft, setTimeLeft] = useState(selectedDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(selectedDuration * 60 * 1000);

  useEffect(() => {
    setTimeLeft(selectedDuration * 60);
    targetTimeRef.current = selectedDuration * 60 * 1000;
  }, [selectedDuration]);

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
        handleComplete(selectedDuration);
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

  const handleComplete = async (actualDuration: number) => {
    try {
      setIsLoading(true);
      onComplete(actualDuration);
    } catch (error) {
      console.error('Error completing timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishEarly = () => {
    const elapsedSeconds = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const actualMinutes = Math.ceil(elapsedSeconds / 60);
    
    setIsRunning(false);
    setIsCompleted(true);
    handleComplete(actualMinutes);
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
    setTimeLeft(selectedDuration * 60);
    setIsRunning(false);
    setIsCompleted(false);
    startTimeRef.current = null;
    targetTimeRef.current = selectedDuration * 60 * 1000;
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      {!isRunning && !isCompleted && (
        <div className="w-full max-w-xs bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <label className="block text-lg font-medium text-slate-800 mb-3">
            Session Duration
          </label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max="120"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Math.max(1, parseInt(e.target.value) || 45))}
                className="block w-full px-4 py-2.5 rounded-lg border border-slate-200 
                         text-lg font-medium text-slate-700
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20
                         transition-all duration-200"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                min
              </span>
            </div>
            <button
              onClick={() => setSelectedDuration(45)}
              className="px-4 py-2.5 rounded-lg text-indigo-600 font-medium
                       hover:bg-indigo-50 transition-colors duration-200
                       flex items-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Reset
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Choose between 1-120 minutes (default: 45)
          </p>
        </div>
      )}

      <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-4 border-indigo-500 bg-white shadow-lg">
        <div className="text-center">
          <div className="text-5xl font-bold text-indigo-600">{formatTime(timeLeft)}</div>
          <div className="text-lg text-slate-600 mt-2">{activity.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleStartPause}
          className={`px-4 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 min-w-[100px] justify-center
                     ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                     transition-colors duration-200 disabled:opacity-50`}
          disabled={isCompleted || isLoading}
        >
          {isRunning ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Pause</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Start</span>
            </>
          )}
        </button>
        {isRunning && (
          <button
            onClick={handleFinishEarly}
            className="px-4 py-2.5 rounded-lg text-white font-medium bg-emerald-600 hover:bg-emerald-700 
                     flex items-center gap-2 min-w-[100px] justify-center transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Finish</span>
          </button>
        )}
        {!isRunning && !isCompleted && (
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg text-white font-medium bg-slate-500 hover:bg-slate-600
                     flex items-center gap-2 min-w-[100px] justify-center transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Reset</span>
          </button>
        )}
      </div>

      {isCompleted && (
        <div className="w-full transform transition-all duration-500 ease-in-out">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl font-medium text-slate-800">Focus session completed!</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">Great job staying focused!</p>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg text-white font-medium bg-emerald-600 hover:bg-emerald-700
                       flex items-center gap-2 mx-auto transition-colors duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              <span>Continue</span>
            </button>
          </div>
        </div>
      )}

      <div className="w-full pt-4">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Duration: {selectedDuration} minutes</span>
          <span>Activity: {activity.name}</span>
        </div>
      </div>
    </div>
  );
} 
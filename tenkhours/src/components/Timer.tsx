import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, TimerSettings, TimerState } from '@/types';
import { getTimerState, saveTimerState } from '@/utils/storage';
import Skeleton from './Skeleton';

interface TimerProps {
  settings: TimerSettings;
  activity: Activity;
  onComplete: (duration: number) => void;
}

export default function Timer({ settings, activity, onComplete }: TimerProps) {
  // Initialize all state at the top
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(settings.focusDuration);
  const [durationInput, setDurationInput] = useState(settings.focusDuration.toString());
  const [timeLeft, setTimeLeft] = useState(selectedDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize all refs
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const targetTimeRef = useRef<number>(selectedDuration * 60 * 1000);
  const lastSaveRef = useRef<number>(0);

  // Group all useEffects together
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        setIsLoading(true);
        const savedState = await getTimerState();
        
        if (savedState && savedState.activityId === activity.id) {
          if (savedState.isRunning || savedState.isPaused) {
            setSelectedDuration(savedState.selectedDuration);
            setDurationInput(savedState.selectedDuration.toString());
            setTimeLeft(savedState.timeLeft);
            setIsRunning(savedState.isRunning);
            setIsPaused(savedState.isPaused);
            startTimeRef.current = savedState.startTime;
            pausedTimeRef.current = savedState.pausedTime;
            totalPausedTimeRef.current = savedState.totalPausedTime;
            targetTimeRef.current = savedState.selectedDuration * 60 * 1000;
          } else {
            await saveTimerState({
              activityId: null,
              startTime: null,
              pausedTime: null,
              totalPausedTime: 0,
              selectedDuration: settings.focusDuration,
              timeLeft: settings.focusDuration * 60,
              isRunning: false,
              isPaused: false
            });
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    loadTimerState();
  }, [activity.id, settings.focusDuration]);

  useEffect(() => {
    const saveState = async () => {
      try {
        if (isRunning || isPaused) {
          const now = Date.now();
          if (now - lastSaveRef.current >= 1000) {
            const state: TimerState = {
              activityId: activity.id,
              startTime: startTimeRef.current,
              pausedTime: pausedTimeRef.current,
              totalPausedTime: totalPausedTimeRef.current,
              selectedDuration,
              timeLeft,
              isRunning,
              isPaused
            };
            await saveTimerState(state);
            lastSaveRef.current = now;
          }
        }
      } catch (error) {
        console.error('Error saving timer state:', error);
      }
    };
    saveState();
  }, [activity.id, selectedDuration, timeLeft, isRunning, isPaused]);

  const handleComplete = useCallback(async (actualDuration: number) => {
    try {
      setIsLoading(true);
      // Await the onComplete callback to ensure data is saved before proceeding
      await onComplete(actualDuration);
      // Clear timer state after completion
      const state: TimerState = {
        activityId: null,
        startTime: null,
        pausedTime: null,
        totalPausedTime: 0,
        selectedDuration: settings.focusDuration,
        timeLeft: settings.focusDuration * 60,
        isRunning: false,
        isPaused: false
      };
      await saveTimerState(state);
    } catch (error) {
      console.error('Error completing timer:', error);
      // Reset UI state on error to allow retry
      setIsCompleted(false);
      setIsRunning(false);
      setIsPaused(false);
      // Show error to user
      alert('Failed to save session data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onComplete, settings.focusDuration]);

  useEffect(() => {
    setTimeLeft(selectedDuration * 60);
    targetTimeRef.current = selectedDuration * 60 * 1000;
  }, [selectedDuration]);

  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (!startTimeRef.current || !isRunning) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current - totalPausedTimeRef.current;
      const remaining = Math.max(0, targetTimeRef.current - elapsed);
      const remainingSeconds = Math.ceil(remaining / 1000);

      setTimeLeft(remainingSeconds);

      if (remaining <= 0) {
        setIsRunning(false);
        setIsPaused(false);
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
  }, [isRunning, selectedDuration, handleComplete]);

  useEffect(() => {
    return () => {
      if (isRunning || isPaused) {
        saveTimerState({
          activityId: activity.id,
          startTime: startTimeRef.current,
          pausedTime: pausedTimeRef.current,
          totalPausedTime: totalPausedTimeRef.current,
          selectedDuration,
          timeLeft,
          isRunning,
          isPaused
        });
      }
    };
  }, [activity.id, selectedDuration, timeLeft, isRunning, isPaused]);

  // Don't render anything until initial state is loaded
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center space-y-8 py-4">
        <Skeleton variant="rectangular" height={80} width="100%" className="max-w-xs" />
        <Skeleton variant="circular" height={192} width={192} />
        <div className="flex gap-4">
          <Skeleton variant="rectangular" height={42} width={100} />
          <Skeleton variant="rectangular" height={42} width={100} />
        </div>
      </div>
    );
  }

  // Calculate values needed for rendering
  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleFinishEarly = async () => {
    const elapsedSeconds = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000)
      : 0;
    const actualMinutes = Math.ceil(elapsedSeconds / 60);
    
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(true);
    await handleComplete(actualMinutes);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (!isRunning && !isPaused) {
      // Starting fresh
      setIsRunning(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = null;
      totalPausedTimeRef.current = 0;
    } else if (isRunning) {
      // Pausing
      setIsRunning(false);
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
    } else if (isPaused) {
      // Resuming
      setIsRunning(true);
      setIsPaused(false);
      if (pausedTimeRef.current) {
        totalPausedTimeRef.current += Date.now() - pausedTimeRef.current;
      }
      pausedTimeRef.current = null;
    }
  };

  const handleReset = async () => {
    setTimeLeft(selectedDuration * 60);
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false);
    startTimeRef.current = null;
    pausedTimeRef.current = null;
    totalPausedTimeRef.current = 0;
    targetTimeRef.current = selectedDuration * 60 * 1000;

    // Reset timer state
    const state: TimerState = {
      activityId: activity.id,
      startTime: null,
      pausedTime: null,
      totalPausedTime: 0,
      selectedDuration,
      timeLeft: selectedDuration * 60,
      isRunning: false,
      isPaused: false
    };
    await saveTimerState(state);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDurationInput(value);
    
    if (value === '') {
      return;
    }

    const duration = parseInt(value);
    if (!isNaN(duration)) {
      const validDuration = Math.min(Math.max(duration, 1), 120);
      setSelectedDuration(validDuration);
    }
  };

  const handleDurationBlur = () => {
    if (durationInput === '') {
      setDurationInput('45');
      setSelectedDuration(45);
    } else {
      const duration = parseInt(durationInput);
      if (isNaN(duration) || duration < 1) {
        setDurationInput('45');
        setSelectedDuration(45);
      } else {
        const validDuration = Math.min(duration, 120);
        setDurationInput(validDuration.toString());
        setSelectedDuration(validDuration);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      {!isRunning && !isPaused && !isCompleted && (
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
                value={durationInput}
                onChange={handleDurationChange}
                onBlur={handleDurationBlur}
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
              onClick={() => {
                setDurationInput('45');
                setSelectedDuration(45);
              }}
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

      <div className="relative w-48 h-48">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90 transform">
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke={isRunning ? activity.color : '#10B981'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-200 ease-linear"
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-5xl font-bold" style={{ color: activity.color }}>{formatTime(timeLeft)}</div>
          <div className="text-lg text-slate-600 mt-2">{activity.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleStartPause}
          className={`px-4 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 min-w-[100px] justify-center
                     ${isRunning ? 'bg-red-500 hover:bg-red-600' : isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}
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
          ) : isPaused ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Resume</span>
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
            onClick={() => handleFinishEarly()}
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
        {(isPaused || (!isRunning && !isCompleted)) && (
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
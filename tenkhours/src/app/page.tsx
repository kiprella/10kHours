'use client';

import { useState } from 'react';
import Timer from '@/components/Timer';
import ActivityTag from '@/components/ActivityTag';
import TimeLog from '@/components/TimeLog';
import Summary from '@/components/Summary';
import { Activity, TimerSettings, TimeLog as TimeLogType } from '@/types';
import { saveTimeLog, updateActivityTotalTime } from '@/utils/storage';

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 0.1,
};

export default function Home() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();

  const handleTimerComplete = () => {
    if (!selectedActivity) return;

    const log: TimeLogType = {
      id: crypto.randomUUID(),
      activityId: selectedActivity.id,
      duration: DEFAULT_SETTINGS.focusDuration,
      timestamp: Date.now(),
    };

    saveTimeLog(log);
    updateActivityTotalTime(selectedActivity.id, log.duration);
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Pomodoro Timer</h1>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Select Activity</h2>
          <ActivityTag
            onSelect={setSelectedActivity}
            selectedActivity={selectedActivity}
          />
        </div>

        {selectedActivity && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Timer</h2>
            <Timer
              settings={DEFAULT_SETTINGS}
              activity={selectedActivity}
              onComplete={handleTimerComplete}
            />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
          <TimeLog />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Focus Statistics</h2>
          <Summary />
        </div>
      </div>
    </main>
  );
}

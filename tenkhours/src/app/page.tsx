'use client';

import { useState } from 'react';
import Timer from '@/components/Timer';
import ActivityTag from '@/components/ActivityTag';
import RecentActivity from '@/components/RecentActivity';
import Summary from '@/components/Summary';
import { Activity, TimerSettings, TimeLog as TimeLogType } from '@/types';
import { addTimeLogAndUpdateActivity } from '@/utils/storage';

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 45,
};

export default function Home() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();
  const handleTimerComplete = async (duration: number) => {
    if (!selectedActivity) return;

    const log: TimeLogType = {
      id: crypto.randomUUID(),
      activityId: selectedActivity.id,
      duration: duration,
      timestamp: Date.now(),
    };

    try {
      await addTimeLogAndUpdateActivity(log);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      }
    } catch (error) {
      alert('Failed to save time log: ' + (error instanceof Error ? error.message : error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="heading-lg mb-0">Focus</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Timer Section */}
          <div className="space-y-6">
            <section className="card">
              <h2 className="heading-md">Select Activity</h2>
              <ActivityTag onSelectActivity={setSelectedActivity} />
            </section>

            {selectedActivity && (
              <section className="card">
                <h2 className="heading-md">Timer</h2>
                <Timer
                  settings={DEFAULT_SETTINGS}
                  activity={selectedActivity}
                  onComplete={handleTimerComplete}
                />
              </section>
            )}

            <section className="card">
              <RecentActivity />
            </section>
          </div>

          {/* Right Column - Statistics Section */}
          <div className="space-y-6">
            <section className="card">
              <h2 className="heading-md">Focus Statistics</h2>
              <Summary />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

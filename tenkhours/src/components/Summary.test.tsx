import React from 'react';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Activity, TimeLog, TimeLogSummary } from '@/types';

vi.mock('react-chartjs-2', () => ({
  Line: (props: Record<string, unknown>) => <div data-testid="line-chart" {...props} />,
  Pie: (props: Record<string, unknown>) => <div data-testid="pie-chart" {...props} />,
}));

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

let currentLogs: TimeLog[] = [];
let currentActivities: Activity[] = [];
let currentSummary: TimeLogSummary;

const getValidatedTimeLogs = vi.fn(async () => currentLogs);
const getActivities = vi.fn(async () => currentActivities);

vi.mock('@/utils/storage', () => ({
  getValidatedTimeLogs: () => getValidatedTimeLogs(),
  getActivities: () => getActivities(),
}));

const getTimeLogSummary = vi.fn(async () => currentSummary);

vi.mock('@/utils/timeLogUtils', () => ({
  getTimeLogSummary: () => getTimeLogSummary(),
}));

import Summary from './Summary';

const createSummary = (minutes: number): TimeLogSummary => ({
  totalSessions: 1,
  totalMinutes: minutes,
  dailyLogs: [],
  weeklyData: [],
  monthlyData: [{ month: '2024-01', minutes }],
  yearlyData: [{ year: '2024', minutes }],
});

describe('Summary', () => {
  beforeEach(() => {
    currentLogs = [
      {
        id: '1',
        activityId: 'a',
        duration: 60,
        timestamp: Date.UTC(2024, 0, 1, 12, 0),
      },
    ];
    currentActivities = [
      { id: 'a', name: 'Guitar Practice', totalTime: 60, color: '#000000' },
    ];
    currentSummary = createSummary(60);

    getValidatedTimeLogs.mockImplementation(async () => currentLogs);
    getActivities.mockImplementation(async () => currentActivities);
    getTimeLogSummary.mockImplementation(async () => currentSummary);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('refreshes totals when time logs are updated', async () => {
    render(<Summary />);

    await waitFor(() => expect(getTimeLogSummary).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText((content, node) => node?.textContent === '1Hours')
    ).toBeInTheDocument();

    currentLogs = [
      {
        id: '2',
        activityId: 'a',
        duration: 180,
        timestamp: Date.UTC(2024, 0, 2, 12, 0),
      },
    ];
    currentActivities = [
      { id: 'a', name: 'Guitar Practice', totalTime: 180, color: '#000000' },
    ];
    currentSummary = createSummary(180);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      await Promise.resolve();
    });

    await waitFor(() => expect(getTimeLogSummary).toHaveBeenCalledTimes(2));
    expect(
      screen.getByText((content, node) => node?.textContent === '3Hours')
    ).toBeInTheDocument();
  });
});

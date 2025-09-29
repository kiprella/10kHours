import React from 'react';
import { act, render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Activity, TimeLog } from '@/types';

let currentLogs: TimeLog[] = [];
let currentActivities: Activity[] = [];

const getValidatedTimeLogs = vi.fn(async () => currentLogs);
const getActivities = vi.fn(async () => currentActivities);
const updateTimeLogAndAdjustActivity = vi.fn();
const deleteTimeLogAndAdjustActivity = vi.fn();

vi.mock('@/utils/storage', () => ({
  getValidatedTimeLogs: () => getValidatedTimeLogs(),
  getActivities: () => getActivities(),
  updateTimeLogAndAdjustActivity: (...args: unknown[]) => updateTimeLogAndAdjustActivity(...args),
  deleteTimeLogAndAdjustActivity: (...args: unknown[]) => deleteTimeLogAndAdjustActivity(...args),
}));

import RecentActivity from './RecentActivity';

describe('RecentActivity', () => {
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
    getValidatedTimeLogs.mockImplementation(async () => currentLogs);
    getActivities.mockImplementation(async () => currentActivities);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reloads when a timeLogUpdated event is dispatched', async () => {
    render(<RecentActivity />);

    await screen.findByText('Guitar Practice');
    expect(getValidatedTimeLogs).toHaveBeenCalledTimes(1);

    currentLogs = [
      {
        id: '2',
        activityId: 'b',
        duration: 90,
        timestamp: Date.UTC(2024, 0, 2, 15, 0),
      },
    ];
    currentActivities = [
      { id: 'b', name: 'Piano Session', totalTime: 90, color: '#123456' },
    ];

    await act(async () => {
      window.dispatchEvent(new CustomEvent('timeLogUpdated'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getValidatedTimeLogs).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Piano Session')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons on hover', async () => {
    render(<RecentActivity />);
    
    await screen.findByText('Guitar Practice');
    
    // Check that edit and delete buttons are present
    const editButton = screen.getByTitle('Edit time log');
    const deleteButton = screen.getByTitle('Delete time log');
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Check that they have the opacity-0 class initially
    expect(editButton.parentElement).toHaveClass('opacity-0');
    expect(deleteButton.parentElement).toHaveClass('opacity-0');
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(<RecentActivity />);

    await screen.findByText('Guitar Practice');

    const editButton = screen.getByTitle('Edit time log');

    expect(editButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(editButton!);
    });

    expect(await screen.findByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });


  it('calls delete function when delete button is clicked', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<RecentActivity />);

    await screen.findByText('Guitar Practice');

    const deleteButton = screen.getByTitle('Delete time log');

    expect(deleteButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(deleteButton!);
    });

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this time log? This action cannot be undone.');
    expect(deleteTimeLogAndAdjustActivity).toHaveBeenCalledWith('1');

    confirmSpy.mockRestore();
  });

});

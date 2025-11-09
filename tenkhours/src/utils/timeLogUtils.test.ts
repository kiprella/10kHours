import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/utils/storage', () => ({
  getValidatedTimeLogs: vi.fn(),
}));

import { getValidatedTimeLogs } from '@/utils/storage';
import { getTimeLogSummary } from '@/utils/timeLogUtils';
import type { TimeLog } from '@/types';

const mockGetValidatedTimeLogs = vi.mocked(getValidatedTimeLogs);

describe('getTimeLogSummary', () => {
  beforeEach(() => {
    mockGetValidatedTimeLogs.mockReset();
  });

  it('aggregates logs using ISO week numbers', async () => {
    const logs: TimeLog[] = [
      {
        id: '1',
        activityId: 'practice',
        duration: 60,
        timestamp: Date.UTC(2020, 11, 31, 12, 0),
      },
      {
        id: '2',
        activityId: 'practice',
        duration: 30,
        timestamp: Date.UTC(2021, 0, 5, 12, 0),
      },
    ];

    mockGetValidatedTimeLogs.mockResolvedValue(logs);

    const summary = await getTimeLogSummary();
    const weeks = summary.weeklyData.map((entry) => entry.week);

    expect(weeks).toContain('2020-W53');
    expect(weeks).toContain('2021-W01');

    const totalsByWeek = Object.fromEntries(summary.weeklyData.map((entry) => [entry.week, entry.minutes]));
    expect(totalsByWeek['2020-W53']).toBe(60);
    expect(totalsByWeek['2021-W01']).toBe(30);
  });
});

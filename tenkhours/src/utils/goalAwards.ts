import { Goal, GoalAward, GoalAwardData, Activity, TimeLog } from '@/types';

const MILESTONE_PERCENTAGES = [25, 50, 75, 100];

/**
 * Calculate goal progress percentage
 */
export function calculateGoalProgress(goal: Goal, activities: Activity[]): number {
  const goalActivities = activities.filter(a => goal.activityIds.includes(a.id));
  if (goalActivities.length === 0) return 0;
  
  const totalTime = goalActivities.reduce((sum, activity) => sum + activity.totalTime, 0);
  return (totalTime / 60) / goal.targetHours * 100;
}

/**
 * Calculate goal progress from time logs
 */
export function calculateGoalProgressFromLogs(goal: Goal, timeLogs: TimeLog[]): number {
  const activityIdSet = new Set(goal.activityIds);
  
  const goalLogs = timeLogs.filter(log => {
    if (log.activityIds) {
      return log.activityIds.some(id => activityIdSet.has(id));
    }
    return log.activityId ? activityIdSet.has(log.activityId) : false;
  });
  
  const totalMinutes = goalLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalHours = totalMinutes / 60;
  
  return (totalHours / goal.targetHours) * 100;
}

/**
 * Get award message for a milestone percentage
 */
export function getAwardMessage(percentage: number, goalName: string): string {
  const messages = {
    25: `🎯 Quarter Master! You've completed 25% of "${goalName}"!`,
    50: `🔥 Halfway Hero! You've reached 50% of "${goalName}"!`,
    75: `⚡ Almost There! You're 75% through "${goalName}"!`,
    100: `🏆 Goal Crusher! You've completed "${goalName}"!`
  };
  
  return messages[percentage as keyof typeof messages] || `🎉 You've reached ${percentage}% of "${goalName}"!`;
}

/**
 * Check which milestones have been achieved and need awards
 */
export function checkNewMilestones(
  currentProgress: number,
  existingAwards: GoalAward[],
  goalId: string
): GoalAward[] {
  const awardedPercentages = new Set(existingAwards.map(award => award.percentage));
  const newAwards: GoalAward[] = [];
  
  for (const percentage of MILESTONE_PERCENTAGES) {
    if (currentProgress >= percentage && !awardedPercentages.has(percentage)) {
      newAwards.push({
        id: `${goalId}-${percentage}-${Date.now()}`,
        goalId,
        percentage,
        awardedAt: Date.now(),
        message: getAwardMessage(percentage, 'your goal') // Will be updated with actual goal name
      });
    }
  }
  
  return newAwards;
}

/**
 * Calculate goal award data including next milestone
 */
export function calculateGoalAwardData(
  goal: Goal,
  activities: Activity[],
  timeLogs: TimeLog[],
  existingAwards: GoalAward[] = []
): GoalAwardData {
  const currentProgress = calculateGoalProgress(goal, activities);
  
  // Deduplicate awards by percentage, keeping the latest one
  const uniqueAwards = existingAwards.reduce((acc, award) => {
    const existing = acc.find(a => a.percentage === award.percentage);
    if (!existing || award.awardedAt > existing.awardedAt) {
      return acc.filter(a => a.percentage !== award.percentage).concat(award);
    }
    return acc;
  }, [] as GoalAward[]).sort((a, b) => a.percentage - b.percentage);
  
  // Find next milestone (the next percentage that hasn't been achieved yet)
  const nextMilestone = MILESTONE_PERCENTAGES.find(percentage => 
    currentProgress < percentage
  ) || null;
  
  // Calculate progress to next milestone
  let progressToNext = 0;
  if (nextMilestone) {
    const previousMilestone = MILESTONE_PERCENTAGES.find(p => p < nextMilestone) || 0;
    const range = nextMilestone - previousMilestone;
    const progressInRange = currentProgress - previousMilestone;
    progressToNext = Math.max(0, Math.min(100, (progressInRange / range) * 100));
  }
  
  return {
    awards: uniqueAwards,
    nextMilestone,
    progressToNext
  };
}

/**
 * Get all awards for a goal, sorted by percentage
 */
export function getGoalAwards(goalId: string, allAwards: GoalAward[]): GoalAward[] {
  return allAwards
    .filter(award => award.goalId === goalId)
    .sort((a, b) => a.percentage - b.percentage);
}

/**
 * Get the latest award for a goal
 */
export function getLatestGoalAward(goalId: string, allAwards: GoalAward[]): GoalAward | null {
  const goalAwards = getGoalAwards(goalId, allAwards);
  return goalAwards.length > 0 ? goalAwards[goalAwards.length - 1] : null;
}

/**
 * Check if a goal has any awards
 */
export function hasGoalAwards(goalId: string, allAwards: GoalAward[]): boolean {
  return allAwards.some(award => award.goalId === goalId);
}

/**
 * Get award statistics for all goals
 */
export function getAwardStatistics(allAwards: GoalAward[]): {
  totalAwards: number;
  awardsByPercentage: Record<number, number>;
  recentAwards: GoalAward[];
} {
  const awardsByPercentage = MILESTONE_PERCENTAGES.reduce((acc, percentage) => {
    acc[percentage] = allAwards.filter(award => award.percentage === percentage).length;
    return acc;
  }, {} as Record<number, number>);
  
  const recentAwards = allAwards
    .sort((a, b) => b.awardedAt - a.awardedAt)
    .slice(0, 5);
  
  return {
    totalAwards: allAwards.length,
    awardsByPercentage,
    recentAwards
  };
}

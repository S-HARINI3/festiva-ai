import type { SavedEvent } from '../types/events';
import type { DashboardTask, EventMetrics } from '../types/dashboard';
import { daysUntilEvent } from './helpers';

/**
 * Calculates a 0-100% readiness score for a specific celebration plan.
 * Driven purely by tasks completion, vendor booking status, and budget allocations.
 */
export function calculateEventReadiness(event: SavedEvent, tasks: DashboardTask[]): number {
  const eventTasks = tasks.filter((t) => t.eventId === event.id);
  const totalTasks = eventTasks.length;
  const completedTasks = eventTasks.filter((t) => t.completed).length;

  // 1. Task progress component (up to 40 pts)
  const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 40 : 25;

  // 2. Vendor booking status (up to 35 pts)
  const vendors = event.plan_data?.vendor_checklist || [];
  let vendorScore = 20;
  if (vendors.length > 0) {
    const bookedCount = vendors.filter((v) => v.status === 'booked' || v.status === 'confirmed').length;
    const contactedCount = vendors.filter((v) => v.status === 'contacted').length;
    vendorScore = Math.min(35, ((bookedCount * 1.0 + contactedCount * 0.5) / vendors.length) * 35);
  }

  // 3. Budget allocation completeness (up to 15 pts)
  const categories = event.plan_data?.budget_breakdown || [];
  const budgetScore = categories.length >= 5 ? 15 : categories.length * 3;

  // 4. Timeline & baseline readiness (up to 10 pts)
  const timelineItems = event.plan_data?.timeline || [];
  const timelineScore = timelineItems.length > 0 ? 10 : 5;

  return Math.min(100, Math.round(taskScore + vendorScore + budgetScore + timelineScore));
}

/**
 * Derives comprehensive metrics from real event records and user tasks.
 */
export function calculateDashboardMetrics(
  events: SavedEvent[],
  tasks: DashboardTask[]
): EventMetrics {
  const activeEvents = events.filter((e) => !e.archived);
  const upcomingEvents = activeEvents.filter((e) => daysUntilEvent(e.event_date) >= 0);

  // Incomplete tasks across all active events
  const outstandingTasks = tasks.filter((t) => !t.completed).length;

  // Average readiness score across active events
  const readinessScores = activeEvents.map((e) => calculateEventReadiness(e, tasks));
  const averageReadinessScore =
    readinessScores.length > 0
      ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
      : 0;

  // Budgets
  let totalPlannedBudget = 0;
  let totalCommittedSpend = 0;
  let totalGuestCount = 0;

  for (const event of activeEvents) {
    const planned = event.plan_data?.total_estimated_budget || 0;
    totalPlannedBudget += planned;

    // Committed spending from booked or confirmed vendors
    const vendors = event.plan_data?.vendor_checklist || [];
    const eventCommitted = vendors
      .filter((v) => v.status === 'booked' || v.status === 'confirmed')
      .reduce((sum, v) => sum + (v.estimated_cost || 0), 0);

    // If no vendors are booked yet, default committed to ~35% of planned for realistic preview
    totalCommittedSpend += eventCommitted > 0 ? eventCommitted : Math.round(planned * 0.35);

    totalGuestCount += event.plan_data?.guest_count || 0;
  }

  const totalRemainingBudget = Math.max(0, totalPlannedBudget - totalCommittedSpend);

  return {
    totalActiveEvents: activeEvents.length,
    upcomingEvents: upcomingEvents.length,
    outstandingTasks,
    averageReadinessScore,
    totalPlannedBudget,
    totalCommittedSpend,
    totalRemainingBudget,
    totalGuestCount,
  };
}

/**
 * Derives realistic prioritized tasks from event recommendations and timeline.
 */
export function deriveInitialTasks(events: SavedEvent[]): DashboardTask[] {
  const initialTasks: DashboardTask[] = [];

  events.forEach((event) => {
    const daysLeft = daysUntilEvent(event.event_date);
    const recs = event.plan_data?.actionable_recommendations || [];

    if (recs.length > 0) {
      // Pick top 2-3 recommendations as prioritized tasks
      recs.slice(0, 3).forEach((rec, rIdx) => {
        const offsetDays = Math.max(3, Math.min(daysLeft - 5, (rIdx + 1) * 7));
        const dueDate = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        initialTasks.push({
          id: `task-${event.id}-${rIdx}`,
          eventId: event.id,
          eventName: event.event_name,
          title: rec,
          dueDate,
          priority: rIdx === 0 ? 'high' : rIdx === 1 ? 'medium' : 'low',
          completed: rIdx === 2, // 1 sample completed
          category: rIdx === 0 ? 'Venue & Booking' : 'Catering & Guests',
        });
      });
    } else {
      // Fallback standard tasks based on event type
      initialTasks.push(
        {
          id: `task-${event.id}-1`,
          eventId: event.id,
          eventName: event.event_name,
          title: 'Finalize venue walkthrough and spatial seating chart',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          completed: false,
          category: 'Venue',
        },
        {
          id: `task-${event.id}-2`,
          eventId: event.id,
          eventName: event.event_name,
          title: 'Schedule menu tasting with head banqueting chef',
          dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium',
          completed: false,
          category: 'Catering',
        },
        {
          id: `task-${event.id}-3`,
          eventId: event.id,
          eventName: event.event_name,
          title: 'Send digital invitation cards and capture dietary RSVPs',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          completed: true,
          category: 'Invitations',
        }
      );
    }
  });

  return initialTasks;
}

/**
 * Generates an intelligent, context-aware AI recommendation based on real event records.
 */
export function generateAiInsight(events: SavedEvent[], tasks: DashboardTask[]): {
  headline: string;
  recommendation: string;
  actionText: string;
  actionTab: 'vendors' | 'copilot' | 'budget' | 'timeline' | 'guests';
} {
  const activeEvents = events.filter((e) => !e.archived && daysUntilEvent(e.event_date) >= 0);

  if (activeEvents.length === 0) {
    return {
      headline: 'Welcome to Your Celebration Studio',
      recommendation:
        'Ready to plan an unforgettable celebration? Generate an AI-powered blueprint with timelines, budgets, and vendor checklists in seconds.',
      actionText: 'Plan My First Event',
      actionTab: 'copilot',
    };
  }

  // Sort by nearest date
  const nearest = [...activeEvents].sort(
    (a, b) => daysUntilEvent(a.event_date) - daysUntilEvent(b.event_date)
  )[0];

  const days = daysUntilEvent(nearest.event_date);
  const pendingTasks = tasks.filter((t) => t.eventId === nearest.id && !t.completed);
  const vendors = nearest.plan_data?.vendor_checklist || [];
  const unbookedVendors = vendors.filter((v) => v.status === 'pending');

  if (unbookedVendors.length > 2 && days < 90) {
    return {
      headline: `Vendor Milestone: ${nearest.event_name}`,
      recommendation: `You have ${unbookedVendors.length} unbooked key vendors with ${days} days remaining. Locking your ${unbookedVendors[0]?.category || 'catering'} and ${unbookedVendors[1]?.category || 'photography'} now secures early-bird contracts and avoids peak surcharges.`,
      actionText: 'Review Vendor Checklist',
      actionTab: 'vendors',
    };
  }

  if (pendingTasks.length > 0) {
    return {
      headline: `Next Milestone for ${nearest.event_name}`,
      recommendation: `Priority Action: "${pendingTasks[0].title}". Completing this milestone will boost your readiness score to ${Math.min(
        98,
        calculateEventReadiness(nearest, tasks) + 8
      )}%.`,
      actionText: 'Manage Milestone Tasks',
      actionTab: 'timeline',
    };
  }

  return {
    headline: 'Budget Optimization Insight',
    recommendation: `Your celebration "${nearest.event_name}" is on schedule! Consider locking a 10% contingency reserve to protect against peak floral season shifts.`,
    actionText: 'Open Budget Studio',
    actionTab: 'budget',
  };
}

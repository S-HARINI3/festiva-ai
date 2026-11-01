export type DashboardTab =
  | 'overview'
  | 'events'
  | 'copilot'
  | 'budget'
  | 'timeline'
  | 'guests'
  | 'vendors'
  | 'moodboards'
  | 'settings';

export interface DashboardTask {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category?: string;
}

export interface DashboardGuest {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  adults: number;
  children: number;
  dietary: string[];
  accessibility: string[];
  isVip: boolean;
  rsvpStatus: 'confirmed' | 'tentative' | 'declined';
}

export interface DashboardVendor {
  id: string;
  eventId: string;
  eventName: string;
  category: string;
  vendorName: string;
  estimatedCost: number;
  status: 'pending' | 'contacted' | 'booked' | 'confirmed';
  notes?: string;
}

export interface EventMetrics {
  totalActiveEvents: number;
  upcomingEvents: number;
  outstandingTasks: number;
  averageReadinessScore: number;
  totalPlannedBudget: number;
  totalCommittedSpend: number;
  totalRemainingBudget: number;
  totalGuestCount: number;
}

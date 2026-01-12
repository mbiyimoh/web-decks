// ============================================================================
// PORTAL TYPE DEFINITIONS
// ============================================================================

export type ProjectStatus = 'on-track' | 'ahead' | 'attention';
export type TaskStatus = 'done' | 'in-progress' | 'upcoming';
export type TimelineBlockStatus = 'done' | 'current' | 'upcoming';
export type DeliverableType = 'completed' | 'inProgress' | 'upcoming';
export type ArtifactType = 'PRESENTATION' | 'PROPOSAL' | 'DELIVERABLE';

export interface Task {
  label: string;
  status: TaskStatus;
}

export interface TrackData {
  title: string;
  tasks: Task[];
}

export interface ActionItem {
  id: number;
  label: string;
  link: string;
  neededFor: string;
}

export interface TimelineBlock {
  weeks: string;
  phase: string;
  status: TimelineBlockStatus;
  items: string[];
}

export interface CompletedDeliverable {
  name: string;
  date: string;
  link?: string;
}

export interface InProgressDeliverable {
  name: string;
  estimate: string;
  progress?: string;
}

export interface UpcomingDeliverable {
  name: string;
  week: string;
}

/**
 * Weekly mindset message - frames the founder's focus for each phase.
 * Key is a week range like "1-2", "3-4", etc.
 */
export interface WeekMindset {
  title: string;
  message: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  currentWeek: number;
  totalWeeks: number;
  targetDelivery: string;
  startDate: string;

  /**
   * Weekly mindset messages keyed by week range (e.g., "1-2", "3-4").
   * Displayed prominently at the top of the project tile to keep founders focused.
   */
  weekMindset?: Record<string, WeekMindset>;

  thisWeek: {
    productBuild: TrackData;
    strategy: TrackData;
  };

  nextWeek: {
    productBuild: string;
    strategy: string;
  };

  actionItems: ActionItem[];

  timeline: {
    productBuild: TimelineBlock[];
    strategy: TimelineBlock[];
  };

  deliverables: {
    completed: CompletedDeliverable[];
    inProgress: InProgressDeliverable[];
    upcoming: UpcomingDeliverable[];
  };
}

export interface ActiveWorkItem {
  id: string;
  module: string;
  context: string;
  status: string;
  progress: string;
  link: string;
}

export interface Artifact {
  id: string | number;
  type: ArtifactType;
  title: string;
  description: string;
  date: string;
  slug?: string;
}

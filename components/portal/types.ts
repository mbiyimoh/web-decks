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

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  currentWeek: number;
  totalWeeks: number;
  targetDelivery: string;
  startDate: string;

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

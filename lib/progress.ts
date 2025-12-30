/**
 * Progress tracking for learning modules
 * Simple localStorage-based implementation
 */

const PROGRESS_KEY = '33s-learning-progress';

interface ProgressData {
  completed: string[]; // Array of "courseId/moduleSlug" keys
}

function getProgressData(): ProgressData {
  if (typeof window === 'undefined') return { completed: [] };

  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : { completed: [] };
  } catch {
    return { completed: [] };
  }
}

function saveProgressData(data: ProgressData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // Silent fail for localStorage errors
  }
}

export function markModuleCompleted(courseId: string, moduleSlug: string): void {
  const data = getProgressData();
  const key = `${courseId}/${moduleSlug}`;

  if (!data.completed.includes(key)) {
    data.completed.push(key);
    saveProgressData(data);
  }
}

export function isModuleCompleted(courseId: string, moduleSlug: string): boolean {
  const data = getProgressData();
  return data.completed.includes(`${courseId}/${moduleSlug}`);
}

export function getCompletedCount(courseId: string): number {
  const data = getProgressData();
  return data.completed.filter((key) => key.startsWith(`${courseId}/`)).length;
}

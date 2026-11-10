import type { Priority, Status } from './types';

export const STATUSES: { id: Status; name: string }[] = [
  { id: 'todo', name: 'To do' },
  { id: 'progress', name: 'In progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
];
export const STATUS_NAME: Record<Status, string> = Object.fromEntries(STATUSES.map((s) => [s.id, s.name])) as Record<Status, string>;
export const STATUS_INDEX: Record<Status, number> = { todo: 0, progress: 1, review: 2, done: 3 };

export const PRIORITIES: { id: Priority; name: string }[] = [
  { id: 'urgent', name: 'Urgent' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
  { id: 'none', name: 'No priority' },
];
export const PRIORITY_NAME: Record<Priority, string> = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.name])) as Record<Priority, string>;
export const PRIORITY_RANK: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };

export type Status = 'todo' | 'progress' | 'review' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type View = 'board' | 'list' | 'calendar';

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  status: Status;
  order: number;
  assignees: string[];
  due: string | null;
  priority: Priority;
  labels: string[];
  checklist: ChecklistItem[];
  comments: Comment[];
  createdAt: string;
}

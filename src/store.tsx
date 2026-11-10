import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Status, Task } from './types';
import { seedTasks } from './data';
import { uid } from './utils';

const KEY = 'taskmere:tasks:v1';

interface Store {
  tasks: Task[];
  addTask: (partial: Partial<Task> & { projectId: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, status: Status, beforeId: string | null) => void;
  deleteTask: (id: string) => void;
  resetData: () => void;
}

const Ctx = createContext<Store | null>(null);

function load(): Task[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => load() ?? seedTasks());

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks]);

  const api = useMemo<Store>(
    () => ({
      tasks,
      addTask(partial) {
        const status = partial.status ?? 'todo';
        const inProject = tasks.filter((t) => t.projectId === partial.projectId);
        const number = inProject.reduce((m, t) => Math.max(m, t.number), 0) + 1;
        const order = inProject.filter((t) => t.status === status).reduce((m, t) => Math.max(m, t.order), 0) + 1;
        const task: Task = {
          id: uid(),
          number,
          title: '',
          description: '',
          order,
          assignees: [],
          due: null,
          priority: 'none',
          labels: [],
          checklist: [],
          comments: [],
          createdAt: new Date().toISOString(),
          ...partial,
          status,
        };
        setTasks((prev) => [...prev, task]);
        return task;
      },
      updateTask(id, patch) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      },
      moveTask(id, status, beforeId) {
        setTasks((prev) => {
          const task = prev.find((t) => t.id === id);
          if (!task) return prev;
          const col = prev
            .filter((t) => t.projectId === task.projectId && t.status === status && t.id !== id)
            .sort((a, b) => a.order - b.order);
          let idx = beforeId ? col.findIndex((t) => t.id === beforeId) : col.length;
          if (idx < 0) idx = col.length;
          col.splice(idx, 0, task);
          const orders = new Map(col.map((t, i) => [t.id, i]));
          return prev.map((t) =>
            t.id === id
              ? { ...t, status, order: orders.get(id)! }
              : orders.has(t.id)
                ? { ...t, order: orders.get(t.id)! }
                : t,
          );
        });
      },
      deleteTask(id) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      },
      resetData() {
        setTasks(seedTasks());
      },
    }),
    [tasks],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

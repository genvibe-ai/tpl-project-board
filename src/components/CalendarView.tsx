import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Task } from '../types';
import { PRIORITY_RANK } from '../meta';
import { useStore } from '../store';
import { addDays, cx, parseISO, startOfDay, toISO } from '../utils';
import { AvatarStack, Dropdown, PriorityIcon, StatusIcon } from './ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({
  tasks,
  onOpen,
  onCreate,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (p: Partial<Task>) => void;
}) {
  const { updateTask } = useStore();
  const todayISO = toISO(startOfDay());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayISO);
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    const end = addDays(last, 6 - ((last.getDay() + 6) % 7));
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due) continue;
      const arr = map.get(t.due) ?? [];
      arr.push(t);
      map.set(t.due, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
    }
    return map;
  }, [tasks]);

  const unscheduled = tasks.filter((t) => !t.due).length;
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const selectedTasks = byDay.get(selected) ?? [];

  const Chip = ({ t }: { t: Task }) => (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', t.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(t.id);
      }}
      title={t.title}
      className="flex h-6 w-full min-w-0 items-center gap-1.5 rounded border border-line bg-surface px-1.5 text-left text-xs shadow-card transition-colors hover:border-line-strong"
    >
      <StatusIcon status={t.status} size={12} />
      <span className={cx('truncate', t.status === 'done' ? 'text-faint line-through' : 'text-fg')}>{t.title || 'Untitled task'}</span>
      {t.priority === 'urgent' && t.status !== 'done' && (
        <span className="ml-auto shrink-0">
          <PriorityIcon priority="urgent" size={11} />
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        <h2 className="min-w-0 text-sm font-semibold tracking-tight sm:text-base">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="ml-auto flex items-center gap-1">
          {unscheduled > 0 && <span className="mr-2 hidden text-xs text-faint md:inline">{unscheduled} without a due date</span>}
          <button onClick={() => shift(-1)} className="icon-btn border border-line bg-surface" aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
              setSelected(todayISO);
            }}
            className="btn btn-outline"
          >
            Today
          </button>
          <button onClick={() => shift(1)} className="icon-btn border border-line bg-surface" aria-label="Next month">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="grid shrink-0 grid-cols-7 border-b border-line bg-surface">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-faint sm:px-3">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid flex-none grid-cols-7 auto-rows-[minmax(3.5rem,1fr)] sm:flex-1 sm:auto-rows-[minmax(7rem,1fr)]">
          {days.map((d) => {
            const iso = toISO(d);
            const inMonth = d.getMonth() === month.getMonth();
            const isToday = iso === todayISO;
            const list = byDay.get(iso) ?? [];
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const visible = list.length > 3 ? list.slice(0, 2) : list;
            return (
              <div
                key={iso}
                onClick={() => setSelected(iso)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (hoverDay !== iso) setHoverDay(iso);
                }}
                onDragLeave={() => setHoverDay((h) => (h === iso ? null : h))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) updateTask(id, { due: iso });
                  setHoverDay(null);
                }}
                className={cx(
                  'group relative flex min-w-0 flex-col gap-1 border-b border-r border-line p-1 transition-colors sm:p-1.5 [&:nth-child(7n)]:border-r-0',
                  inMonth ? (isWeekend ? 'bg-canvas/50' : 'bg-surface') : 'bg-canvas',
                  hoverDay === iso && 'bg-accent-soft',
                  selected === iso && 'max-sm:bg-accent-soft',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cx(
                      'grid size-6 place-items-center rounded-full text-xs tabular-nums',
                      isToday ? 'bg-accent font-semibold text-accent-fg' : inMonth ? 'font-medium text-fg' : 'text-faint',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreate({ due: iso });
                    }}
                    className="hidden size-6 place-items-center rounded text-faint opacity-0 transition-opacity hover:bg-raised hover:text-fg focus:opacity-100 group-hover:opacity-100 sm:grid"
                    aria-label={`Add task on ${d.toDateString()}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Phone: dots */}
                {list.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 px-1 sm:hidden">
                    {list.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className={cx('size-1.5 rounded-full', t.status === 'done' ? 'bg-line-strong' : t.priority === 'urgent' ? 'bg-danger' : 'bg-accent')}
                      />
                    ))}
                  </div>
                )}

                {/* Tablet & desktop: chips */}
                <div className="hidden min-w-0 flex-col gap-1 sm:flex">
                  {visible.map((t) => (
                    <Chip key={t.id} t={t} />
                  ))}
                  {list.length > 3 && (
                    <Dropdown
                      className="w-64"
                      trigger={({ toggle }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle();
                          }}
                          className="h-5 rounded px-1.5 text-left text-xs font-medium text-muted hover:bg-raised hover:text-fg"
                        >
                          +{list.length - 2} more
                        </button>
                      )}
                    >
                      {() => (
                        <div className="space-y-1 p-1">
                          <p className="px-1 pb-1 text-xs font-medium text-faint">
                            {parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          {list.map((t) => (
                            <Chip key={t.id} t={t} />
                          ))}
                        </div>
                      )}
                    </Dropdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Phone agenda for the selected day */}
        <div className="border-t border-line p-4 sm:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-ui font-semibold">
              {parseISO(selected).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <button onClick={() => onCreate({ due: selected })} className="btn btn-outline h-7 px-2 text-xs">
              <Plus size={13} /> Add
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="rounded-md border border-dashed border-line py-6 text-center text-xs text-faint">Nothing due this day</p>
          ) : (
            <ul className="space-y-2">
              {selectedTasks.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => onOpen(t.id)}
                    className="flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5 text-left shadow-card"
                  >
                    <StatusIcon status={t.status} />
                    <span className={cx('min-w-0 flex-1 truncate text-ui font-medium', t.status === 'done' && 'text-muted')}>{t.title}</span>
                    <PriorityIcon priority={t.priority} />
                    <AvatarStack ids={t.assignees} size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

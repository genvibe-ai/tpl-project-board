import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Calendar, ChevronRight, CircleDot, Flag, Plus, Tag, Trash2, Users, X } from 'lucide-react';
import type { Task } from '../types';
import { CURRENT_USER, LABELS, MEMBERS, MEMBER_MAP, PROJECT_MAP, taskKey } from '../data';
import { PRIORITIES, PRIORITY_NAME, STATUSES, STATUS_NAME } from '../meta';
import { useStore } from '../store';
import { addDays, cx, formatLong, isOverdue, relTime, startOfDay, toISO, uid } from '../utils';
import { Avatar, AvatarStack, Checkbox, Dropdown, Kbd, LabelChip, MenuItem, PriorityIcon, StatusIcon } from './ui';

export function TaskDrawer({
  taskId,
  onClose,
  focusTitle,
  onFocused,
}: {
  taskId: string | null;
  onClose: () => void;
  focusTitle: boolean;
  onFocused: () => void;
}) {
  const { tasks } = useStore();
  const lastId = useRef<string | null>(null);
  if (taskId) lastId.current = taskId;
  const task = tasks.find((t) => t.id === (taskId ?? lastId.current));
  const open = !!taskId && !!task;

  return (
    <>
      <div
        onClick={onClose}
        className={cx(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 dark:bg-black/50',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Task details"
        className={cx(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-drawer transition-transform duration-200 ease-out sm:max-w-lg',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        {task && <DrawerBody key={task.id} task={task} onClose={onClose} focusTitle={open && focusTitle} onFocused={onFocused} />}
      </aside>
    </>
  );
}

function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

function Prop({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <>
      <div className="flex h-8 items-center gap-2 text-ui text-muted">
        <span className="text-faint">{icon}</span>
        {label}
      </div>
      <div className="flex min-w-0 items-center">{children}</div>
    </>
  );
}

const propBtn = 'flex min-h-8 max-w-full items-center gap-2 rounded-md px-2 -mx-2 text-ui text-fg transition-colors hover:bg-raised';

function DrawerBody({ task, onClose, focusTitle, onFocused }: { task: Task; onClose: () => void; focusTitle: boolean; onFocused: () => void }) {
  const { updateTask, moveTask, deleteTask } = useStore();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [comment, setComment] = useState('');
  const project = PROJECT_MAP[task.projectId];
  const set = (patch: Partial<Task>) => updateTask(task.id, patch);

  useAutosize(titleRef, task.title);
  useAutosize(descRef, task.description);

  useEffect(() => {
    if (!focusTitle) return;
    const t = setTimeout(() => {
      titleRef.current?.focus({ preventScroll: true });
      onFocused();
    }, 80);
    return () => clearTimeout(t);
  }, [focusTitle, onFocused]);

  const done = task.checklist.filter((c) => c.done).length;
  const total = task.checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const today = startOfDay();
  const nextMonday = addDays(today, ((8 - today.getDay()) % 7) || 7);

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    set({ checklist: [...task.checklist, { id: uid(), text, done: false }] });
    setNewItem('');
  };

  const postComment = () => {
    const text = comment.trim();
    if (!text) return;
    set({ comments: [...task.comments, { id: uid(), authorId: CURRENT_USER, text, createdAt: new Date().toISOString() }] });
    setComment('');
  };

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-5">
        {confirming ? (
          <div className="flex flex-1 animate-fade items-center gap-2">
            <span className="text-ui font-medium">Delete this task?</span>
            <button onClick={() => setConfirming(false)} className="btn btn-ghost ml-auto h-7 px-2.5 text-xs">
              Cancel
            </button>
            <button
              onClick={() => {
                deleteTask(task.id);
                onClose();
              }}
              className="btn h-7 bg-danger px-2.5 text-xs text-white hover:opacity-90"
            >
              Delete
            </button>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-faint">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: project?.color }} />
              <span className="truncate">{project?.name}</span>
              <ChevronRight size={12} />
              <span className="font-mono text-muted">{taskKey(task)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setConfirming(true)} className="icon-btn hover:text-danger" aria-label="Delete task">
                <Trash2 size={15} />
              </button>
              <button onClick={onClose} className="btn btn-ghost h-8 gap-2 px-2" aria-label="Close">
                <Kbd className="max-sm:hidden">Esc</Kbd>
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <textarea
          ref={titleRef}
          rows={1}
          value={task.title}
          onChange={(e) => set({ title: e.target.value.replace(/\n/g, '') })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              descRef.current?.focus();
            }
          }}
          placeholder="Task title"
          aria-label="Task title"
          className="-mx-2 w-[calc(100%+1rem)] resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold leading-snug tracking-tight text-fg outline-none transition-colors placeholder:text-faint hover:border-line focus:border-accent"
        />

        <div className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-1">
          <Prop icon={<CircleDot size={14} />} label="Status">
            <Dropdown
              trigger={({ toggle }) => (
                <button onClick={toggle} className={propBtn}>
                  <StatusIcon status={task.status} />
                  {STATUS_NAME[task.status]}
                </button>
              )}
            >
              {(close) =>
                STATUSES.map((s) => (
                  <MenuItem
                    key={s.id}
                    selected={s.id === task.status}
                    onClick={() => {
                      if (s.id !== task.status) moveTask(task.id, s.id, null);
                      close();
                    }}
                  >
                    <StatusIcon status={s.id} /> {s.name}
                  </MenuItem>
                ))
              }
            </Dropdown>
          </Prop>

          <Prop icon={<Users size={14} />} label="Assignees">
            <Dropdown
              trigger={({ toggle }) => (
                <button onClick={toggle} className={propBtn}>
                  {task.assignees.length ? (
                    <>
                      <AvatarStack ids={task.assignees} size={22} max={4} />
                      <span className="truncate">
                        {task.assignees.length === 1 ? MEMBER_MAP[task.assignees[0]]?.name : `${task.assignees.length} people`}
                      </span>
                    </>
                  ) : (
                    <span className="text-faint">Unassigned</span>
                  )}
                </button>
              )}
              className="w-60"
            >
              {() =>
                MEMBERS.map((m) => {
                  const on = task.assignees.includes(m.id);
                  return (
                    <MenuItem
                      key={m.id}
                      selected={on}
                      onClick={() => set({ assignees: on ? task.assignees.filter((a) => a !== m.id) : [...task.assignees, m.id] })}
                    >
                      <Avatar id={m.id} size={20} className="ring-0" />
                      <span className="truncate">{m.name}</span>
                    </MenuItem>
                  );
                })
              }
            </Dropdown>
          </Prop>

          <Prop icon={<Calendar size={14} />} label="Due date">
            <Dropdown
              trigger={({ toggle }) => (
                <button onClick={toggle} className={cx(propBtn, isOverdue(task) && 'text-danger')}>
                  {task.due ? formatLong(task.due) : <span className="text-faint">No due date</span>}
                  {isOverdue(task) && <span className="rounded bg-danger-soft px-1.5 text-xs font-medium text-danger">Overdue</span>}
                </button>
              )}
              className="w-60"
            >
              {(close) => (
                <>
                  {[
                    { label: 'Today', d: today },
                    { label: 'Tomorrow', d: addDays(today, 1) },
                    { label: 'Next Monday', d: nextMonday },
                    { label: 'In 2 weeks', d: addDays(today, 14) },
                  ].map((o) => (
                    <MenuItem
                      key={o.label}
                      selected={task.due === toISO(o.d)}
                      onClick={() => {
                        set({ due: toISO(o.d) });
                        close();
                      }}
                    >
                      {o.label}
                      <span className="ml-auto text-xs text-faint">{o.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </MenuItem>
                  ))}
                  <div className="my-1 border-t border-line" />
                  <div className="px-1 py-1">
                    <input
                      type="date"
                      value={task.due ?? ''}
                      onChange={(e) => set({ due: e.target.value || null })}
                      className="field h-8 px-2"
                      aria-label="Pick a date"
                    />
                  </div>
                  {task.due && (
                    <MenuItem
                      onClick={() => {
                        set({ due: null });
                        close();
                      }}
                    >
                      <span className="text-muted">Clear date</span>
                    </MenuItem>
                  )}
                </>
              )}
            </Dropdown>
          </Prop>

          <Prop icon={<Flag size={14} />} label="Priority">
            <Dropdown
              trigger={({ toggle }) => (
                <button onClick={toggle} className={propBtn}>
                  <PriorityIcon priority={task.priority} />
                  <span className={task.priority === 'none' ? 'text-faint' : ''}>{PRIORITY_NAME[task.priority]}</span>
                </button>
              )}
            >
              {(close) =>
                PRIORITIES.map((p) => (
                  <MenuItem
                    key={p.id}
                    selected={p.id === task.priority}
                    onClick={() => {
                      set({ priority: p.id });
                      close();
                    }}
                  >
                    <PriorityIcon priority={p.id} /> {p.name}
                  </MenuItem>
                ))
              }
            </Dropdown>
          </Prop>

          <Prop icon={<Tag size={14} />} label="Labels">
            <Dropdown
              trigger={({ toggle }) => (
                <button onClick={toggle} className={cx(propBtn, 'flex-wrap py-1')}>
                  {task.labels.length ? task.labels.map((l) => <LabelChip key={l} id={l} />) : <span className="text-faint">Add labels</span>}
                </button>
              )}
              className="w-56"
            >
              {() =>
                LABELS.map((l) => {
                  const on = task.labels.includes(l.id);
                  return (
                    <MenuItem
                      key={l.id}
                      selected={on}
                      onClick={() => set({ labels: on ? task.labels.filter((x) => x !== l.id) : [...task.labels, l.id] })}
                    >
                      <span className="size-2 rounded-full" style={{ background: l.color }} />
                      {l.name}
                    </MenuItem>
                  );
                })
              }
            </Dropdown>
          </Prop>
        </div>

        <section className="mt-6">
          <h3 className="mb-1.5 text-xs font-semibold text-muted">Description</h3>
          <textarea
            ref={descRef}
            rows={3}
            value={task.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Add more detail — context, links, acceptance criteria…"
            className="-mx-2 w-[calc(100%+1rem)] resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-ui leading-relaxed text-fg outline-none transition-colors placeholder:text-faint hover:border-line focus:border-accent"
          />
        </section>

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted">Checklist</h3>
            {total > 0 && (
              <span className={cx('text-xs tabular-nums', pct === 100 ? 'font-medium text-success' : 'text-faint')}>
                {done}/{total} · {pct}%
              </span>
            )}
          </div>
          {total > 0 && (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-raised">
              <div
                className={cx('h-full rounded-full transition-[width] duration-300 ease-out', pct === 100 ? 'bg-success' : 'bg-accent')}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <ul>
            {task.checklist.map((item) => (
              <li key={item.id} className="group -mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-subtle">
                <Checkbox
                  checked={item.done}
                  label={item.text}
                  onChange={() => set({ checklist: task.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) })}
                />
                <input
                  value={item.text}
                  onChange={(e) => set({ checklist: task.checklist.map((c) => (c.id === item.id ? { ...c, text: e.target.value } : c)) })}
                  onBlur={() => {
                    if (!item.text.trim()) set({ checklist: task.checklist.filter((c) => c.id !== item.id) });
                  }}
                  className={cx('h-6 min-w-0 flex-1 bg-transparent text-ui outline-none', item.done ? 'text-faint line-through' : 'text-fg')}
                />
                <button
                  onClick={() => set({ checklist: task.checklist.filter((c) => c.id !== item.id) })}
                  className="grid size-6 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-fg focus:opacity-100 group-hover:opacity-100"
                  aria-label="Remove item"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
          <div className="-mx-1.5 mt-1 flex items-center gap-2.5 px-1.5">
            <Plus size={16} className="text-faint" />
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Add an item"
              className="h-8 flex-1 bg-transparent text-ui text-fg outline-none placeholder:text-faint"
            />
          </div>
        </section>

        <section className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-xs font-semibold text-muted">
            Comments <span className="font-normal text-faint">{task.comments.length || ''}</span>
          </h3>
          <ul className="space-y-4">
            {task.comments.map((c) => (
              <li key={c.id} className="flex animate-fade gap-3">
                <Avatar id={c.authorId} size={28} className="ring-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-ui">
                    <span className="font-medium text-fg">{MEMBER_MAP[c.authorId]?.name ?? 'Someone'}</span>
                    <span className="ml-2 text-xs text-faint">{relTime(c.createdAt)}</span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-ui leading-relaxed text-fg">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <Avatar id={CURRENT_USER} size={28} className="ring-0" />
            <div className="flex-1 rounded-md border border-line bg-surface transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    postComment();
                  }
                }}
                rows={2}
                placeholder="Leave a comment…"
                className="block w-full resize-none bg-transparent px-3 pt-2 text-ui text-fg outline-none placeholder:text-faint"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="pl-1 text-xs text-faint">⌘ Enter to send</span>
                <button onClick={postComment} disabled={!comment.trim()} className="btn btn-primary h-7 px-2.5 text-xs">
                  Comment
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

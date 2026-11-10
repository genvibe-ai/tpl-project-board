import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Plus, UserRound } from 'lucide-react';
import type { Task } from '../types';
import { MEMBERS, taskKey } from '../data';
import { PRIORITY_RANK, STATUSES, STATUS_INDEX } from '../meta';
import { cx, dayDiff, formatDue, isOverdue, useLocalState } from '../utils';
import { Avatar, AvatarStack, Dropdown, LabelChip, MenuItem, PriorityIcon, Segmented, StatusIcon } from './ui';

type GroupBy = 'status' | 'assignee';
type SortKey = 'manual' | 'due' | 'priority' | 'title' | 'created';

const SORTS: { key: SortKey; name: string }[] = [
  { key: 'manual', name: 'Board order' },
  { key: 'due', name: 'Due date' },
  { key: 'priority', name: 'Priority' },
  { key: 'title', name: 'Title' },
  { key: 'created', name: 'Created' },
];

const ROW_GRID =
  'grid grid-cols-[16px_minmax(0,1fr)_auto] sm:grid-cols-[16px_56px_minmax(0,1fr)_72px_88px] lg:grid-cols-[16px_56px_minmax(0,1fr)_200px_72px_72px_88px] items-center gap-x-3';

export function ListView({
  tasks,
  onOpen,
  onCreate,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (p: Partial<Task>) => void;
}) {
  const [groupBy, setGroupBy] = useLocalState<GroupBy>('taskmere:list-group', 'status');
  const [sort, setSort] = useLocalState<{ key: SortKey; dir: 'asc' | 'desc' }>('taskmere:list-sort', { key: 'manual', dir: 'asc' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sorter = useMemo(() => {
    const flip = sort.dir === 'asc' ? 1 : -1;
    return (a: Task, b: Task) => {
      switch (sort.key) {
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due) * flip;
        case 'priority':
          return (PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]) * flip;
        case 'title':
          return a.title.localeCompare(b.title) * flip;
        case 'created':
          return a.createdAt.localeCompare(b.createdAt) * flip;
        default:
          return (STATUS_INDEX[a.status] - STATUS_INDEX[b.status] || a.order - b.order) * flip;
      }
    };
  }, [sort]);

  const groups = useMemo(() => {
    type G = { key: string; title: string; icon: ReactNode; tasks: Task[]; preset: Partial<Task> };
    if (groupBy === 'status') {
      return STATUSES.map<G>((s) => ({
        key: s.id,
        title: s.name,
        icon: <StatusIcon status={s.id} />,
        tasks: tasks.filter((t) => t.status === s.id).sort(sorter),
        preset: { status: s.id },
      }));
    }
    const gs = MEMBERS.map<G>((m) => ({
      key: m.id,
      title: m.name,
      icon: <Avatar id={m.id} size={18} className="ring-0" />,
      tasks: tasks.filter((t) => t.assignees.includes(m.id)).sort(sorter),
      preset: { assignees: [m.id] },
    }));
    gs.push({
      key: 'none',
      title: 'Unassigned',
      icon: (
        <span className="grid size-[18px] place-items-center rounded-full bg-raised text-faint">
          <UserRound size={11} />
        </span>
      ),
      tasks: tasks.filter((t) => !t.assignees.length).sort(sorter),
      preset: {},
    });
    return gs.filter((g) => g.tasks.length > 0);
  }, [groupBy, tasks, sorter]);

  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const HeadBtn = ({ k, children, className }: { k: SortKey; children: ReactNode; className?: string }) => (
    <button
      onClick={() => sortBy(k)}
      className={cx('inline-flex items-center gap-1 text-left transition-colors hover:text-fg', sort.key === k && 'text-fg', className)}
    >
      {children}
      {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 sm:px-6">
        <span className="mr-1 hidden text-xs text-faint sm:inline">Group by</span>
        <Segmented
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { value: 'status', label: 'Status' },
            { value: 'assignee', label: 'Assignee' },
          ]}
        />
        <div className="ml-auto flex items-center gap-1">
          <Dropdown
            align="right"
            trigger={({ toggle }) => (
              <button onClick={toggle} className="btn btn-outline">
                <ArrowUpDown size={14} className="text-faint" />
                <span className="hidden sm:inline text-muted">Sort:</span> {SORTS.find((s) => s.key === sort.key)?.name}
              </button>
            )}
          >
            {(close) =>
              SORTS.map((s) => (
                <MenuItem
                  key={s.key}
                  selected={s.key === sort.key}
                  onClick={() => {
                    setSort({ key: s.key, dir: sort.dir });
                    close();
                  }}
                >
                  {s.name}
                </MenuItem>
              ))
            }
          </Dropdown>
          <button
            onClick={() => setSort({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
            className="icon-btn border border-line bg-surface"
            aria-label={sort.dir === 'asc' ? 'Ascending' : 'Descending'}
            title={sort.dir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sort.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cx(ROW_GRID, 'sticky top-0 z-10 h-9 border-b border-line bg-surface px-4 text-xs font-medium text-faint sm:px-6')}>
          <span />
          <span className="hidden sm:block">ID</span>
          <HeadBtn k="title">Title</HeadBtn>
          <span className="hidden lg:block">Labels</span>
          <span className="hidden sm:block">People</span>
          <HeadBtn k="priority" className="max-lg:hidden">Priority</HeadBtn>
          <HeadBtn k="due" className="justify-end sm:justify-start">Due</HeadBtn>
        </div>

        {groups.length === 0 && (
          <div className="grid place-items-center px-6 py-24 text-center">
            <p className="text-sm font-medium">No tasks match</p>
            <p className="mt-1 text-ui text-faint">Try a different search or clear the team filter.</p>
          </div>
        )}

        {groups.map((g) => {
          const isCollapsed = collapsed[g.key];
          return (
            <section key={g.key}>
              <div className="group flex h-10 items-center gap-2 border-b border-line bg-canvas px-4 sm:px-6">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown size={14} className={cx('text-faint transition-transform duration-150', isCollapsed && '-rotate-90')} />
                  {g.icon}
                  <span className="truncate text-ui font-semibold">{g.title}</span>
                  <span className="text-xs tabular-nums text-faint">{g.tasks.length}</span>
                </button>
                <button onClick={() => onCreate(g.preset)} className="icon-btn size-7" aria-label={`Add task to ${g.title}`}>
                  <Plus size={14} />
                </button>
              </div>
              {!isCollapsed &&
                g.tasks.map((t) => {
                  const overdue = isOverdue(t);
                  return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpen(t.id)}
                      onKeyDown={(e) => e.key === 'Enter' && onOpen(t.id)}
                      className={cx(ROW_GRID, 'h-11 cursor-pointer border-b border-line px-4 transition-colors hover:bg-subtle sm:px-6')}
                    >
                      <StatusIcon status={t.status} />
                      <span className="hidden font-mono text-[11px] text-faint sm:block">{taskKey(t)}</span>
                      <span className={cx('truncate text-ui font-medium', t.status === 'done' ? 'text-muted' : 'text-fg')}>
                        {t.title || 'Untitled task'}
                      </span>
                      <span className="hidden min-w-0 gap-1 overflow-hidden lg:flex">
                        {t.labels.slice(0, 2).map((l) => (
                          <LabelChip key={l} id={l} />
                        ))}
                      </span>
                      <span className="hidden sm:block">
                        <AvatarStack ids={t.assignees} size={20} />
                      </span>
                      <span className="hidden lg:block">
                        <PriorityIcon priority={t.priority} />
                      </span>
                      <span
                        className={cx(
                          'text-right text-xs tabular-nums sm:text-left',
                          overdue ? 'font-medium text-danger' : t.due && dayDiff(t.due) === 0 && t.status !== 'done' ? 'font-medium text-fg' : 'text-muted',
                        )}
                      >
                        {t.due ? formatDue(t.due) : <span className="text-faint">—</span>}
                      </span>
                    </div>
                  );
                })}
            </section>
          );
        })}
      </div>
    </div>
  );
}

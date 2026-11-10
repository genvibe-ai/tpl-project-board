import type { RefObject } from 'react';
import { Columns3, Moon, RotateCcw, Search, Sun, X } from 'lucide-react';
import { MEMBERS, PROJECTS } from '../data';
import { useStore } from '../store';
import { cx } from '../utils';
import { Avatar, Kbd } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onProject: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  memberFilter: string | null;
  onMember: (id: string | null) => void;
  theme: 'light' | 'dark';
  onTheme: (t: 'light' | 'dark') => void;
}

export function Sidebar(p: Props) {
  const { tasks, resetData } = useStore();
  const projectTasks = tasks.filter((t) => t.projectId === p.projectId);

  return (
    <>
      <div
        onClick={p.onClose}
        className={cx(
          'fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 lg:hidden',
          p.open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-canvas transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          p.open ? 'translate-x-0 shadow-lift lg:shadow-none' : '-translate-x-full',
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-14 items-center gap-2.5 px-4">
          <div className="grid size-7 place-items-center rounded-md bg-accent text-accent-fg">
            <Columns3 size={16} strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Taskmere</span>
          <button onClick={p.onClose} className="icon-btn ml-auto lg:hidden" aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={p.searchRef}
              value={p.search}
              onChange={(e) => p.onSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  if (p.search) p.onSearch('');
                  else e.currentTarget.blur();
                }
              }}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="field h-8 pl-8 pr-8"
            />
            {p.search ? (
              <button
                onClick={() => p.onSearch('')}
                className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-faint hover:text-fg"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            ) : (
              <Kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">/</Kbd>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-1 pt-3 text-xs font-medium text-faint">Projects</p>
          <ul className="space-y-0.5">
            {PROJECTS.map((pr) => {
              const active = pr.id === p.projectId;
              const open = tasks.filter((t) => t.projectId === pr.id && t.status !== 'done').length;
              return (
                <li key={pr.id}>
                  <button
                    onClick={() => p.onProject(pr.id)}
                    className={cx(
                      'flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-ui transition-colors',
                      active ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-subtle hover:text-fg',
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: pr.color }} />
                    <span className="truncate">{pr.name}</span>
                    <span className="ml-auto text-xs tabular-nums text-faint">{open}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between px-2 pb-1 pt-6">
            <p className="text-xs font-medium text-faint">Team</p>
            {p.memberFilter && (
              <button onClick={() => p.onMember(null)} className="text-xs text-accent-text hover:underline">
                Clear filter
              </button>
            )}
          </div>
          <ul className="space-y-0.5">
            {MEMBERS.map((m) => {
              const active = p.memberFilter === m.id;
              const count = projectTasks.filter((t) => t.assignees.includes(m.id) && t.status !== 'done').length;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => p.onMember(active ? null : m.id)}
                    aria-pressed={active}
                    className={cx(
                      'flex h-10 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors',
                      active ? 'bg-accent-soft' : 'hover:bg-subtle',
                    )}
                  >
                    <Avatar id={m.id} size={24} className="ring-0" />
                    <span className="min-w-0 leading-tight">
                      <span className={cx('block truncate text-ui', active ? 'font-medium text-accent-text' : 'text-fg')}>{m.name}</span>
                      <span className="block truncate text-xs text-faint">{m.role}</span>
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-faint">{count || ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <div className="hidden items-center gap-3 px-1 text-xs text-faint sm:flex">
            <span className="flex items-center gap-1"><Kbd>N</Kbd> New</span>
            <span className="flex items-center gap-1"><Kbd>/</Kbd> Search</span>
            <span className="flex items-center gap-1"><Kbd>Esc</Kbd> Close</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 rounded-md border border-line bg-subtle p-0.5" role="group" aria-label="Theme">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => p.onTheme(t)}
                  aria-pressed={p.theme === t}
                  aria-label={`${t} theme`}
                  className={cx(
                    'grid w-8 place-items-center rounded transition-colors',
                    p.theme === t ? 'bg-surface text-fg shadow-card' : 'text-faint hover:text-fg',
                  )}
                >
                  {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all projects to the sample data? Your changes will be lost.')) resetData();
              }}
              className="btn btn-ghost ml-auto h-8 px-2 text-xs"
            >
              <RotateCcw size={13} /> Reset data
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

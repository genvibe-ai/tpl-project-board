import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, List, Menu, Plus, Search, SquareKanban, X } from 'lucide-react';
import type { Task, View } from './types';
import { LABEL_MAP, MEMBERS, MEMBER_MAP, PROJECTS, PROJECT_MAP, taskKey } from './data';
import { StoreProvider, useStore } from './store';
import { isTypingTarget, useLocalState } from './utils';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { TaskDrawer } from './components/TaskDrawer';
import { Avatar, AvatarStack, Kbd, Segmented } from './components/ui';

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const VIEW_OPTIONS: { value: View; label: string; icon: ReactNode }[] = [
  { value: 'board', label: 'Board', icon: <SquareKanban size={14} /> },
  { value: 'list', label: 'List', icon: <List size={14} /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarDays size={14} /> },
];

function Shell() {
  const { tasks, addTask, updateTask } = useStore();
  const [projectId, setProjectId] = useLocalState('taskmere:project', 'p1');
  const [view, setView] = useLocalState<View>('taskmere:view', 'board');
  const [theme, setTheme] = useLocalState<'light' | 'dark'>(
    'taskmere:theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [focusTitle, setFocusTitle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const project = PROJECT_MAP[projectId] ?? PROJECTS[0];
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const q = search.trim().toLowerCase();
  const visible = projectTasks.filter(
    (t) =>
      (!memberFilter || t.assignees.includes(memberFilter)) &&
      (!q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        taskKey(t).toLowerCase().includes(q) ||
        t.labels.some((l) => LABEL_MAP[l]?.name.toLowerCase().includes(q))),
  );
  const openCount = projectTasks.filter((t) => t.status !== 'done').length;
  const doneCount = projectTasks.length - openCount;
  const filtered = !!q || !!memberFilter;

  const createTask = (preset: Partial<Task> = {}) => {
    const t = addTask({ projectId: project.id, status: 'todo', ...preset });
    setFocusTitle(true);
    setOpenId(t.id);
  };

  const closeDrawer = () => {
    if (openId) {
      const t = tasks.find((x) => x.id === openId);
      if (t && !t.title.trim()) updateTask(openId, { title: 'Untitled task' });
    }
    setOpenId(null);
  };

  const onFocused = useCallback(() => setFocusTitle(false), []);

  const focusSearch = () => {
    if (window.innerWidth < 1024) setSidebarOpen(true);
    setTimeout(() => searchRef.current?.focus(), 60);
  };

  // Close drawer if its task disappears (deleted / reset)
  useEffect(() => {
    if (openId && !tasks.some((t) => t.id === openId)) setOpenId(null);
  }, [tasks, openId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.querySelector('[data-popover]')) return;
        if (openId) {
          e.preventDefault();
          closeDrawer();
        } else if (sidebarOpen) setSidebarOpen(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        createTask();
      } else if (e.key === '/') {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectProject = (id: string) => {
    setProjectId(id);
    setOpenId(null);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-fg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projectId={project.id}
        onProject={selectProject}
        search={search}
        onSearch={setSearch}
        searchRef={searchRef}
        memberFilter={memberFilter}
        onMember={(id) => {
          setMemberFilter(id);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        theme={theme}
        onTheme={setTheme}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-surface lg:my-2 lg:mr-2 lg:rounded-lg lg:border lg:border-line lg:shadow-card">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:gap-3 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="icon-btn lg:hidden" aria-label="Open sidebar">
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-initial">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: project.color }} />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">{project.name}</h1>
              <p className="hidden text-xs leading-tight text-faint sm:block">
                {openCount} open · {doneCount} done
              </p>
            </div>
          </div>

          <Segmented className="ml-3 max-md:hidden" value={view} onChange={setView} options={VIEW_OPTIONS} />

          <div className="ml-auto flex items-center gap-2">
            {memberFilter && MEMBER_MAP[memberFilter] && (
              <span className="hidden h-7 items-center gap-1.5 rounded-md bg-accent-soft pl-1 pr-1 text-xs font-medium text-accent-text sm:inline-flex">
                <Avatar id={memberFilter} size={18} className="ring-0" />
                {MEMBER_MAP[memberFilter].name.split(' ')[0]}
                <button onClick={() => setMemberFilter(null)} className="grid size-5 place-items-center rounded hover:bg-surface/60" aria-label="Clear filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {q && (
              <span className="hidden h-7 items-center gap-1.5 rounded-md border border-line px-2 text-xs text-muted sm:inline-flex">
                <Search size={12} /> “{search.trim()}”
                <button onClick={() => setSearch('')} className="grid size-4 place-items-center text-faint hover:text-fg" aria-label="Clear search">
                  <X size={12} />
                </button>
              </span>
            )}
            <button onClick={focusSearch} className="icon-btn lg:hidden" aria-label="Search">
              <Search size={16} />
            </button>
            <div className="hidden xl:block">
              <AvatarStack ids={MEMBERS.map((m) => m.id)} size={26} max={6} />
            </div>
            <button onClick={() => createTask()} className="btn btn-primary px-2.5 sm:px-3" aria-label="New task">
              <Plus size={15} />
              <span className="hidden sm:inline">New task</span>
              <Kbd className="border-accent-fg/25 bg-transparent text-accent-fg/80 max-sm:hidden">N</Kbd>
            </button>
          </div>
        </header>

        <div className="border-b border-line px-3 py-2 md:hidden">
          <Segmented className="w-full" value={view} onChange={setView} options={VIEW_OPTIONS} />
        </div>

        {filtered && (
          <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-1.5 text-xs text-muted sm:px-6">
            Showing {visible.length} of {projectTasks.length} tasks
            <button
              onClick={() => {
                setSearch('');
                setMemberFilter(null);
              }}
              className="ml-auto font-medium text-accent-text hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <div key={`${project.id}-${view}`} className="min-h-0 flex-1 animate-fade">
          {view === 'board' && <Board tasks={visible} projectId={project.id} onOpen={setOpenId} />}
          {view === 'list' && <ListView tasks={visible} onOpen={setOpenId} onCreate={createTask} />}
          {view === 'calendar' && <CalendarView tasks={visible} onOpen={setOpenId} onCreate={createTask} />}
        </div>
      </main>

      <TaskDrawer taskId={openId} onClose={closeDrawer} focusTitle={focusTitle} onFocused={onFocused} />
    </div>
  );
}

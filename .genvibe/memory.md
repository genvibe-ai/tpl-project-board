## What this app is
Taskmere, a project board for small teams (fictional brand). Vite 8, React 19, TypeScript, Tailwind CSS 4, lucide-react. Runs entirely in the browser on sample tasks saved in localStorage (`taskmere:tasks:v1`): no backend, no env vars. Scripts: `yarn dev`, `yarn build`.

## Built so far
Board with To do, In progress, Review and Done columns (drag and drop, task counts, quick add), a task drawer (assignees, due date, priority, labels, checklist, comments), a list view grouped by status or assignee, a month calendar, a sidebar with three projects, search and the team, keyboard shortcuts (N new task, / search, Esc close), light and dark themes, and "Reset data". On phones the header fits one row and the board scrolls sideways a column at a time.

## Design
Near-white surfaces, near-black type in Geist (Geist Mono for task keys), one electric-blue accent (#1f5eff; #3b76ff in dark), 1px borders, quick animations. No gradients.

## Structure
- `src/meta.ts`: the team (`MEMBERS`, `CURRENT_USER`), `PROJECTS` and `LABELS`.
- `src/data.ts`: statuses, priorities, task keys and `seedTasks()` (the sample tasks).
- `src/store.tsx`: state and localStorage; `src/types.ts`; `src/utils.ts`.
- `src/components/`: Sidebar, Board, TaskCard, TaskDrawer, ListView, CalendarView, ui.

## User preferences & rules
Rename projects, the team and labels in `src/meta.ts`, and statuses in `src/data.ts`; keep the colour tokens in `src/index.css`; the app must keep working with no backend and no env vars. Team portraits are Unsplash photos.

## Open issues & next ideas
Each browser has its own board. Ideas: Supabase for sign-in and shared boards, live updates between teammates, file attachments, notifications.

import type { HTMLAttributes } from 'react';
import { Calendar, MessageSquare, SquareCheckBig } from 'lucide-react';
import type { Task } from '../types';
import { taskKey } from '../data';
import { cx, dayDiff, formatDue, isOverdue } from '../utils';
import { AvatarStack, LabelChip, PriorityIcon } from './ui';

export function TaskCard({
  task,
  overlay,
  ...rest
}: { task: Task; overlay?: boolean } & HTMLAttributes<HTMLDivElement>) {
  const total = task.checklist.length;
  const done = task.checklist.filter((c) => c.done).length;
  const overdue = isOverdue(task);
  const dueToday = !!task.due && task.status !== 'done' && dayDiff(task.due) === 0;

  return (
    <div
      data-card-id={overlay ? undefined : task.id}
      role={overlay ? undefined : 'button'}
      tabIndex={overlay ? -1 : 0}
      {...rest}
      className={cx(
        'group relative cursor-pointer rounded-md border bg-surface p-3 text-left',
        overlay ? 'border-line-strong shadow-lift' : 'animate-fade border-line shadow-card transition-colors hover:border-line-strong',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-faint">{taskKey(task)}</span>
        <span className="ml-auto">
          <PriorityIcon priority={task.priority} />
        </span>
      </div>
      <p className={cx('mt-1 text-ui font-medium leading-snug', task.status === 'done' ? 'text-muted' : 'text-fg')}>
        {task.title || 'Untitled task'}
      </p>
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <LabelChip key={l} id={l} />
          ))}
        </div>
      )}
      <div className="mt-3 flex min-h-5 items-center gap-3 text-xs text-faint">
        {task.due && (
          <span className={cx('inline-flex items-center gap-1', overdue && 'font-medium text-danger', dueToday && 'font-medium text-fg')}>
            <Calendar size={12} />
            {formatDue(task.due)}
          </span>
        )}
        {total > 0 && (
          <span className={cx('inline-flex items-center gap-1 tabular-nums', done === total && 'text-success')}>
            <SquareCheckBig size={12} />
            {done}/{total}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageSquare size={12} />
            {task.comments.length}
          </span>
        )}
        <span className="ml-auto">
          <AvatarStack ids={task.assignees} size={20} />
        </span>
      </div>
    </div>
  );
}

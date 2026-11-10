import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { Priority, Status } from '../types';
import { LABEL_MAP, MEMBER_MAP } from '../data';
import { cx } from '../utils';

export function Avatar({ id, size = 20, className }: { id: string; size?: number; className?: string }) {
  const m = MEMBER_MAP[id];
  if (!m) return null;
  return (
    <img
      src={m.avatar}
      alt={m.name}
      title={m.name}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className={cx('shrink-0 rounded-full object-cover bg-subtle ring-2 ring-surface', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function AvatarStack({ ids, size = 20, max = 3 }: { ids: string[]; size?: number; max?: number }) {
  if (!ids.length) return null;
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((id) => (
        <Avatar key={id} id={id} size={size} />
      ))}
      {extra > 0 && (
        <span
          className="grid place-items-center rounded-full bg-raised text-[10px] font-medium text-muted ring-2 ring-surface"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const color = { todo: 'var(--faint)', progress: 'var(--warning)', review: 'var(--accent)', done: 'var(--success)' }[status];
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
      {status === 'done' ? (
        <>
          <circle cx="7" cy="7" r="6" fill={color} />
          <path d="M4.3 7.2l1.8 1.8 3.6-3.8" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.6" stroke={color} strokeWidth="1.5" strokeDasharray={status === 'todo' ? '2.2 1.8' : undefined} />
          {status === 'progress' && <path d="M7 7 L7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill={color} />}
          {status === 'review' && <path d="M7 7 L7 3.5 A3.5 3.5 0 1 1 3.5 7 Z" fill={color} />}
        </>
      )}
    </svg>
  );
}

export function PriorityIcon({ priority, size = 14 }: { priority: Priority; size?: number }) {
  if (priority === 'urgent') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-label="Urgent" className="shrink-0">
        <rect x="1" y="1" width="12" height="12" rx="3" fill="var(--danger)" />
        <path d="M7 3.8v4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="7" cy="10.2" r="0.95" fill="#fff" />
      </svg>
    );
  }
  if (priority === 'none') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-label="No priority" className="shrink-0">
        <path d="M2.5 7h1.5M6.25 7h1.5M10 7h1.5" stroke="var(--faint)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  const level = { low: 1, medium: 2, high: 3 }[priority];
  const bars = [
    { x: 1.5, y: 8.5, h: 4 },
    { x: 5.75, y: 5.5, h: 7 },
    { x: 10, y: 2, h: 10.5 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-label={priority} className="shrink-0">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="2.5" height={b.h} rx="0.8" fill={i < level ? 'var(--fg)' : 'var(--line-strong)'} />
      ))}
    </svg>
  );
}

export function LabelChip({ id }: { id: string }) {
  const l = LABEL_MAP[id];
  if (!l) return null;
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded border border-line bg-surface px-1.5 text-xs text-muted">
      <span className="size-1.5 rounded-full" style={{ background: l.color }} />
      {l.name}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cx(
        'inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-surface px-1 font-mono text-[11px] font-medium text-faint',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          data-popover
          className={cx(
            'absolute z-50 mt-1 min-w-48 rounded-lg border border-line bg-surface p-1 shadow-pop animate-pop',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  selected,
}: {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-ui text-fg transition-colors hover:bg-raised"
    >
      {children}
      <span className="ml-auto w-4">{selected && <Check size={14} className="text-accent" />}</span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('inline-flex h-8 items-center gap-0.5 rounded-md border border-line bg-subtle p-0.5', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded px-2.5 text-ui font-medium transition-colors',
              active ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'grid size-4 shrink-0 place-items-center rounded border transition-colors',
        checked ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface hover:border-accent',
      )}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  );
}

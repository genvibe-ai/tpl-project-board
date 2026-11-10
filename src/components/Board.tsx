import { Fragment, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Status, Task } from '../types';
import { STATUSES } from '../meta';
import { useStore } from '../store';
import { cx } from '../utils';
import { TaskCard } from './TaskCard';
import { StatusIcon } from './ui';

interface DragState {
  id: string;
  status: Status;
  index: number;
  height: number;
  width: number;
}

interface PointerInfo {
  id: string;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  started: boolean;
  touch: boolean;
  timer: number;
  raf: number;
}

export function Board({ tasks, projectId, onOpen }: { tasks: Task[]; projectId: string; onOpen: (id: string) => void }) {
  const { moveTask, addTask } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Partial<Record<Status, HTMLElement | null>>>({});
  const listRefs = useRef<Partial<Record<Status, HTMLDivElement | null>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const pointer = useRef<PointerInfo | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [activeCol, setActiveCol] = useState(0);
  const [quickSignal, setQuickSignal] = useState<Partial<Record<Status, number>>>({});

  const columns = STATUSES.map((s) => ({
    ...s,
    tasks: tasks.filter((t) => t.status === s.id).sort((a, b) => a.order - b.order),
  }));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const moveRef = useRef(moveTask);
  moveRef.current = moveTask;

  const setDragState = (next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  // FLIP: animate cards from their previous position to the new one after every layout change
  useLayoutEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const next = new Map<string, { x: number; y: number }>();
    for (const s of STATUSES) {
      const list = listRefs.current[s.id];
      if (!list) continue;
      const lr = list.getBoundingClientRect();
      list.querySelectorAll<HTMLElement>('[data-card-id]').forEach((el) => {
        const id = el.dataset.cardId!;
        const pos = { x: lr.left + el.offsetLeft + sc.scrollLeft, y: lr.top + el.offsetTop };
        next.set(id, pos);
        const prev = positions.current.get(id);
        if (!prev) return;
        const dx = prev.x - pos.x;
        const dy = prev.y - pos.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.getBoundingClientRect();
        requestAnimationFrame(() => {
          el.style.transition = 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)';
          el.style.transform = '';
          el.addEventListener('transitionend', () => (el.style.transition = ''), { once: true });
        });
      });
    }
    positions.current = next;
  });

  useEffect(() => {
    positions.current.clear();
  }, [projectId]);

  const positionOverlay = () => {
    const p = pointer.current;
    const o = overlayRef.current;
    if (!p || !o) return;
    o.style.transform = `translate3d(${p.x - p.offsetX}px, ${p.y - p.offsetY}px, 0) rotate(1.5deg)`;
  };

  useLayoutEffect(positionOverlay, [drag?.id]);

  const hitTest = (x: number, y: number) => {
    const cur = dragRef.current;
    if (!cur) return;
    let status = cur.status;
    for (const s of STATUSES) {
      const el = colRefs.current[s.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right) {
        status = s.id;
        break;
      }
    }
    const list = listRefs.current[status];
    if (!list) return;
    const lr = list.getBoundingClientRect();
    let index = 0;
    list.querySelectorAll<HTMLElement>('[data-card-id]').forEach((el) => {
      const mid = lr.top - list.scrollTop + el.offsetTop + el.offsetHeight / 2;
      if (mid < y) index++;
    });
    if (status !== cur.status || index !== cur.index) setDragState({ ...cur, status, index });
  };

  const autoScroll = () => {
    const p = pointer.current;
    const sc = scrollerRef.current;
    if (!p || !sc) return;
    const r = sc.getBoundingClientRect();
    const edge = 56;
    let moved = false;
    if (p.x < r.left + edge) {
      sc.scrollLeft -= Math.min(16, Math.ceil((r.left + edge - p.x) / 4));
      moved = true;
    } else if (p.x > r.right - edge) {
      sc.scrollLeft += Math.min(16, Math.ceil((p.x - (r.right - edge)) / 4));
      moved = true;
    }
    const cur = dragRef.current;
    const list = cur ? listRefs.current[cur.status] : null;
    if (list) {
      const lr = list.getBoundingClientRect();
      if (p.y < lr.top + 40) {
        list.scrollTop -= Math.min(14, Math.ceil((lr.top + 40 - p.y) / 4));
        moved = true;
      } else if (p.y > lr.bottom - 40) {
        list.scrollTop += Math.min(14, Math.ceil((p.y - (lr.bottom - 40)) / 4));
        moved = true;
      }
    }
    if (moved) hitTest(p.x, p.y);
  };

  const onCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>, task: Task, index: number) => {
    if (e.button !== 0 || pointer.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p: PointerInfo = {
      id: task.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      started: false,
      touch: e.pointerType !== 'mouse',
      timer: 0,
      raf: 0,
    };
    pointer.current = p;

    const begin = () => {
      p.started = true;
      document.body.classList.add('is-dragging');
      if (p.touch) navigator.vibrate?.(8);
      setDragState({ id: task.id, status: task.status, index, height: rect.height, width: rect.width });
      const loop = () => {
        autoScroll();
        p.raf = requestAnimationFrame(loop);
      };
      p.raf = requestAnimationFrame(loop);
    };

    const cleanup = () => {
      clearTimeout(p.timer);
      cancelAnimationFrame(p.raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('touchmove', onTouchMove);
      document.body.classList.remove('is-dragging');
      pointer.current = null;
    };

    const finish = () => {
      const cur = dragRef.current;
      if (!cur) return;
      const col = columnsRef.current.find((c) => c.id === cur.status);
      const others = col ? col.tasks.filter((t) => t.id !== cur.id) : [];
      const before = others[cur.index]?.id ?? null;
      const sc = scrollerRef.current;
      const list = listRefs.current[cur.status];
      if (sc && list) {
        positions.current.set(cur.id, { x: p.x - p.offsetX + sc.scrollLeft, y: p.y - p.offsetY + list.scrollTop });
      }
      moveRef.current(cur.id, cur.status, before);
      setDragState(null);
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
    };

    function onMove(ev: PointerEvent) {
      p.x = ev.clientX;
      p.y = ev.clientY;
      if (!p.started) {
        const dist = Math.hypot(p.x - p.startX, p.y - p.startY);
        if (p.touch) {
          if (dist > 8) cleanup();
        } else if (dist > 4) begin();
        return;
      }
      positionOverlay();
      hitTest(p.x, p.y);
    }
    function onTouchMove(ev: TouchEvent) {
      if (p.started) ev.preventDefault();
    }
    function onUp() {
      if (p.started) finish();
      cleanup();
    }
    function onCancel() {
      if (p.started) setDragState(null);
      cleanup();
    }

    if (p.touch) p.timer = window.setTimeout(begin, 220);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
  };

  const onScroll = () => {
    const sc = scrollerRef.current;
    if (!sc) return;
    let best = 0;
    let bestDist = Infinity;
    STATUSES.forEach((s, i) => {
      const el = colRefs.current[s.id];
      if (!el) return;
      const d = Math.abs(el.offsetLeft - sc.scrollLeft - 16);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveCol(best);
  };

  const jumpTo = (i: number) => {
    const sc = scrollerRef.current;
    const el = colRefs.current[STATUSES[i].id];
    if (sc && el) sc.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' });
  };

  const dragged = drag ? tasks.find((t) => t.id === drag.id) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Phone column switcher */}
      <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 sm:hidden">
        {columns.map((c, i) => (
          <button
            key={c.id}
            onClick={() => jumpTo(i)}
            className={cx(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
              activeCol === i ? 'bg-raised text-fg' : 'text-muted',
            )}
          >
            <StatusIcon status={c.id} size={12} />
            {c.name}
            <span className="tabular-nums text-faint">{c.tasks.length}</span>
          </button>
        ))}
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={cx(
          'relative flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-3 sm:px-6 sm:pt-4',
          !drag && 'snap-x snap-mandatory sm:snap-none',
        )}
      >
        {columns.map((col) => {
          const isTarget = drag?.status === col.id;
          const items = col.tasks.filter((t) => t.id !== drag?.id);
          const placeholder = drag && (
            <div
              key="placeholder"
              className="shrink-0 rounded-md border border-dashed border-accent bg-accent-soft/60"
              style={{ height: drag.height }}
            />
          );
          return (
            <section
              key={col.id}
              ref={(el) => {
                colRefs.current[col.id] = el;
              }}
              className={cx(
                'flex max-h-full w-[calc(100vw-2rem)] shrink-0 snap-start scroll-ml-4 flex-col rounded-lg border bg-canvas transition-colors sm:w-72 lg:w-auto lg:min-w-56 lg:flex-1',
                isTarget ? 'border-line-strong' : 'border-line',
              )}
              aria-label={col.name}
            >
              <header className="flex h-11 shrink-0 items-center gap-2 px-3">
                <StatusIcon status={col.id} />
                <h2 className="text-ui font-semibold">{col.name}</h2>
                <span className="rounded bg-raised px-1.5 text-xs font-medium tabular-nums text-muted">{col.tasks.length}</span>
                <button
                  onClick={() => setQuickSignal((q) => ({ ...q, [col.id]: (q[col.id] ?? 0) + 1 }))}
                  className="icon-btn ml-auto size-7"
                  aria-label={`Add task to ${col.name}`}
                >
                  <Plus size={15} />
                </button>
              </header>
              <div
                ref={(el) => {
                  listRefs.current[col.id] = el;
                }}
                className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
              >
                {items.map((t, i) => (
                  <Fragment key={t.id}>
                    {isTarget && drag.index === i && placeholder}
                    <TaskCard
                      task={t}
                      onPointerDown={(e) => onCardPointerDown(e, t, i)}
                      onClick={() => {
                        if (!suppressClick.current) onOpen(t.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpen(t.id);
                        }
                      }}
                    />
                  </Fragment>
                ))}
                {isTarget && drag.index >= items.length && placeholder}
                {items.length === 0 && !isTarget && (
                  <div className="grid h-20 shrink-0 place-items-center rounded-md border border-dashed border-line text-xs text-faint">
                    No tasks
                  </div>
                )}
                <QuickAdd
                  signal={quickSignal[col.id] ?? 0}
                  onAdd={(title) => addTask({ projectId, status: col.id, title })}
                />
              </div>
            </section>
          );
        })}
      </div>

      {drag && dragged && (
        <div
          ref={overlayRef}
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{ width: drag.width, willChange: 'transform' }}
        >
          <TaskCard task={dragged} overlay />
        </div>
      )}
    </div>
  );
}

function QuickAdd({ signal, onAdd }: { signal: number; onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (signal) setOpen(true);
  }, [signal]);

  useEffect(() => {
    if (open) {
      ref.current?.focus();
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [open, signal]);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue('');
    requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'nearest' }));
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-ui text-faint transition-colors hover:bg-raised hover:text-fg"
      >
        <Plus size={14} /> Add task
      </button>
    );
  }

  return (
    <div className="shrink-0 animate-pop rounded-md border border-accent bg-surface p-2 shadow-card ring-2 ring-accent/15">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
            setValue('');
          }
        }}
        onBlur={() => {
          if (!value.trim()) setOpen(false);
        }}
        placeholder="What needs to be done?"
        className="w-full resize-none bg-transparent text-ui text-fg outline-none placeholder:text-faint"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-faint">Enter to add · Esc to close</span>
        <button onMouseDown={(e) => e.preventDefault()} onClick={submit} className="btn btn-primary h-7 px-2.5 text-xs">
          Add
        </button>
      </div>
    </div>
  );
}

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { announceLayout } from '@/components/Scene/lightLayout';
import classes from './Masonry.module.css';
import { columnsFor, layoutMasonry, type MasonryLayout } from './layoutMasonry';

export interface MasonryItem {
  key: string | number;
  node: ReactNode;
  /** Set on an item that is only decoration: it is hidden from assistive technology and drawn on wide layouts only. */
  decoration?: boolean;
}

interface MasonryProps {
  items: readonly MasonryItem[];
  /** Pixels between neighbours, both ways. */
  gap?: number;
}

interface Metrics {
  columns: number;
  columnWidth: number;
}

const EMPTY: MasonryLayout = { placements: [], height: 0 };

/**
 * A list laid out in columns by measuring. The items stay in one flat list in the DOM, in order, so reading order and tab order follow the list; only their position on screen is computed.
 * Decorations join the list on a three column layout only.
 */
export function Masonry({ items, gap = 8 }: MasonryProps) {
  const list = useRef<HTMLUListElement>(null);
  const nodes = useRef(new Map<string | number, HTMLLIElement>());
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [layout, setLayout] = useState<MasonryLayout>(EMPTY);

  const visible = useMemo(
    () => items.filter(item => !item.decoration || (metrics?.columns ?? 1) >= 3),
    [items, metrics?.columns],
  );

  // The width of the list decides the columns. It changes with the window, so it is observed.
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const columns = columnsFor(width);
      const columnWidth = Math.max(0, (width - gap * (columns - 1)) / columns);
      setMetrics(previous =>
        previous && previous.columns === columns && Math.abs(previous.columnWidth - columnWidth) < 0.5
          ? previous
          : { columns, columnWidth },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [gap]);

  // The height of every item decides the rows. A quest can grow or shrink (Read more), so each item is observed.
  useLayoutEffect(() => {
    if (!metrics) return;
    const place = () => {
      const heights = visible.map(item => nodes.current.get(item.key)?.offsetHeight ?? 0);
      setLayout(previous => {
        const next = layoutMasonry(heights, metrics.columns, metrics.columnWidth, gap);
        const same =
          previous.height === next.height &&
          previous.placements.length === next.placements.length &&
          previous.placements.every((p, index) => {
            const q = next.placements[index];
            return q !== undefined && p.column === q.column && p.x === q.x && p.y === q.y;
          });
        return same ? previous : next;
      });
    };
    place();
    const observer = new ResizeObserver(place);
    for (const item of visible) {
      const node = nodes.current.get(item.key);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [visible, metrics, gap]);

  // Anything that depends on where the items are (the cast shadows) hears about it once they have moved.
  useLayoutEffect(() => {
    announceLayout();
  }, [layout]);

  return (
    <ul
      ref={list}
      className={classes.list}
      data-columns={metrics?.columns}
      data-ready={layout.placements.length === visible.length && visible.length > 0 ? '' : undefined}
      style={{ height: layout.height || undefined }}
    >
      {visible.map((item, index) => {
        const placement = layout.placements[index];
        return (
          <li
            key={item.key}
            ref={node => {
              if (node) nodes.current.set(item.key, node);
              else nodes.current.delete(item.key);
            }}
            className={classes.item}
            data-column={placement?.column}
            aria-hidden={item.decoration || undefined}
            style={{
              width: metrics?.columnWidth,
              transform: placement ? `translate(${placement.x}px, ${placement.y}px)` : undefined,
            }}
          >
            {item.node}
          </li>
        );
      })}
    </ul>
  );
}

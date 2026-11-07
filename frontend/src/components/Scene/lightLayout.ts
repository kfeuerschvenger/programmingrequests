import type { LightId } from './lighting';

/** Dispatched on window after anything moves on the board, so the light pools and the cast shadows are measured again. */
export const LAYOUT_EVENT = 'cq:layout';

export interface Point {
  x: number;
  y: number;
}

export const announceLayout = () => window.dispatchEvent(new Event(LAYOUT_EVENT));

/** Where a source shines from when its prop is hidden (the torch and lantern are not drawn on narrow screens): the board edge it hangs on. */
const FALLBACKS: Record<LightId, (board: DOMRect) => Point> = {
  torch: board => ({ x: board.left + 16, y: board.top + 760 }),
  lantern: board => ({ x: board.right - 16, y: board.top + 900 }),
  candle: board => ({ x: board.right - 120, y: board.top + 520 }),
};

const centre = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

/** The viewport position of every source: the centre of its flame when it is on screen, its fallback otherwise. */
export function measureSources(board: HTMLElement): Record<LightId, Point> {
  const boardRect = board.getBoundingClientRect();
  const result = {} as Record<LightId, Point>;
  for (const id of Object.keys(FALLBACKS) as LightId[]) {
    const flame = board.querySelector<HTMLElement>(`[data-light-source="${id}"]`);
    const rect = flame?.getBoundingClientRect();
    result[id] = rect && rect.width > 0 && rect.height > 0 ? centre(rect) : FALLBACKS[id](boardRect);
  }
  return result;
}

/** Writes each pool's position, relative to the board, as custom properties. */
export function placePools(board: HTMLElement, targets: readonly HTMLElement[]): void {
  const boardRect = board.getBoundingClientRect();
  const sources = measureSources(board);
  for (const id of Object.keys(sources) as LightId[]) {
    const x = `${(sources[id].x - boardRect.left).toFixed(1)}px`;
    const y = `${(sources[id].y - boardRect.top).toFixed(1)}px`;
    for (const target of targets) {
      target.style.setProperty(`--${id}-x`, x);
      target.style.setProperty(`--${id}-y`, y);
    }
  }
}

/** How far a shadow reaches from its object, in pixels. */
const SHADOW_REACH = 9;

/**
 * Points the shadow of every element marked `data-cast` away from the nearest source. By day the element's own shadow variables are cleared, so the stylesheet default applies: down and to the right, away from the sun in the top left.
 * Only the direction is set here. The flicker never touches a shadow, so no card is repainted by it.
 */
export function castShadows(board: HTMLElement, dark: boolean): void {
  const items = document.querySelectorAll<HTMLElement>('[data-cast]');
  if (!dark) {
    items.forEach(item => {
      item.style.removeProperty('--cq-shadow-x');
      item.style.removeProperty('--cq-shadow-y');
    });
    return;
  }
  const sources = Object.values(measureSources(board));
  items.forEach(item => {
    const at = centre(item.getBoundingClientRect());
    const distance = (source: Point) => Math.hypot(source.x - at.x, source.y - at.y);
    const nearest = sources.reduce((best, source) => (distance(source) < distance(best) ? source : best));
    const dx = at.x - nearest.x;
    const dy = at.y - nearest.y;
    const length = Math.hypot(dx, dy) || 1;
    item.style.setProperty('--cq-shadow-x', `${((dx / length) * SHADOW_REACH).toFixed(1)}px`);
    item.style.setProperty('--cq-shadow-y', `${((dy / length) * SHADOW_REACH).toFixed(1)}px`);
  });
}

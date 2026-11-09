import type { LightId } from './lighting';

/** Dispatched on window after anything moves on the board, so the light pools and the cast shadows are measured again. */
export const LAYOUT_EVENT = 'cq:layout';

export interface Point {
  x: number;
  y: number;
}

export const announceLayout = () => window.dispatchEvent(new Event(LAYOUT_EVENT));

/** Where a source shines from until its flame has been measured (the candle arrives with the lazy quest list): near the edge of the scene it belongs to. */
const FALLBACKS: Record<LightId, (scene: DOMRect) => Point> = {
  torch: scene => ({ x: scene.left + 16, y: scene.top + 760 }),
  lantern: scene => ({ x: scene.right - 16, y: scene.top + 900 }),
  candle: scene => ({ x: scene.right - 120, y: scene.top + 520 }),
};

const ALL_SOURCES: readonly LightId[] = ['torch', 'lantern', 'candle'];

const centre = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

/** The viewport position of each source in `ids`: the centre of its flame when it is on screen, its fallback otherwise. `ids` holds only the sources that are drawn at the current width. */
export function measureSources(
  scene: HTMLElement,
  ids: readonly LightId[] = ALL_SOURCES,
): Partial<Record<LightId, Point>> {
  const sceneRect = scene.getBoundingClientRect();
  const result: Partial<Record<LightId, Point>> = {};
  for (const id of ids) {
    const flame = scene.querySelector<HTMLElement>(`[data-light-source="${id}"]`);
    const rect = flame?.getBoundingClientRect();
    result[id] = rect && rect.width > 0 && rect.height > 0 ? centre(rect) : FALLBACKS[id](sceneRect);
  }
  return result;
}

/** Writes each pool's position, relative to the scene, as custom properties. */
export function placePools(
  scene: HTMLElement,
  targets: readonly HTMLElement[],
  ids: readonly LightId[] = ALL_SOURCES,
): void {
  const sceneRect = scene.getBoundingClientRect();
  const sources = measureSources(scene, ids);
  for (const id of ids) {
    const source = sources[id];
    if (!source) continue;
    const x = `${(source.x - sceneRect.left).toFixed(1)}px`;
    const y = `${(source.y - sceneRect.top).toFixed(1)}px`;
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
export function castShadows(scene: HTMLElement, dark: boolean, ids: readonly LightId[] = ALL_SOURCES): void {
  const items = document.querySelectorAll<HTMLElement>('[data-cast]');
  if (!dark) {
    items.forEach(item => {
      item.style.removeProperty('--cq-shadow-x');
      item.style.removeProperty('--cq-shadow-y');
    });
    return;
  }
  const sources = Object.values(measureSources(scene, ids));
  if (sources.length === 0) return;
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

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

/** The shadow written on each element the last time, as `x|y`, or `null` once it was cleared. An unchanged value is not written again, so a pass that moves nothing dirties no style. */
const written = new WeakMap<HTMLElement, string | null>();

/** Every shadow caster of the scene, plus those of an open dialog: Mantine portals the modal to the body, outside the scene. */
const casters = (scene: HTMLElement): HTMLElement[] => {
  const found = new Set<HTMLElement>(scene.querySelectorAll<HTMLElement>('[data-cast]'));
  document.querySelectorAll<HTMLElement>('[role="dialog"] [data-cast]').forEach(item => found.add(item));
  return [...found];
};

/**
 * Points the shadow of every element marked `data-cast` away from the nearest source. By day the element's own shadow variables are cleared, so the stylesheet default applies: down and to the right, away from the sun in the top left.
 * Only the direction is set here. The flicker never touches a shadow, so no card is repainted by it.
 * Every measurement is taken before the first write: a read that follows a write forces a layout, so interleaving them would cost one layout per card.
 */
export function castShadows(scene: HTMLElement, dark: boolean, ids: readonly LightId[] = ALL_SOURCES): void {
  const items = casters(scene);
  if (!dark) {
    for (const item of items) {
      if (written.get(item) == null) continue;
      item.style.removeProperty('--cq-shadow-x');
      item.style.removeProperty('--cq-shadow-y');
      written.set(item, null);
    }
    return;
  }
  const sources = Object.values(measureSources(scene, ids));
  if (sources.length === 0) return;
  const centres = items.map(item => centre(item.getBoundingClientRect()));
  items.forEach((item, index) => {
    const at = centres[index] as Point;
    const distance = (source: Point) => Math.hypot(source.x - at.x, source.y - at.y);
    const nearest = sources.reduce((best, source) => (distance(source) < distance(best) ? source : best));
    const dx = at.x - nearest.x;
    const dy = at.y - nearest.y;
    const length = Math.hypot(dx, dy) || 1;
    const x = `${((dx / length) * SHADOW_REACH).toFixed(1)}px`;
    const y = `${((dy / length) * SHADOW_REACH).toFixed(1)}px`;
    if (written.get(item) === `${x}|${y}`) return;
    item.style.setProperty('--cq-shadow-x', x);
    item.style.setProperty('--cq-shadow-y', y);
    written.set(item, `${x}|${y}`);
  });
}

// Captures the product screenshots and the hero animation of Code Quests.
//
// It drives a running stack whose API was started with the Spring profile `demo`, which resets the
// database to the demo quests at every start. Each still is taken in a real browser and written twice:
// the raw screenshot and the same screenshot inside a browser (or phone) frame rendered from frame.html.
// The hero slug records a video instead, which gif.mjs turns into a GIF and an MP4.
//
// The stills write nothing to the product: the only click that could submit anything is on a form whose
// fields fail validation, so the browser never sends the request. The hero flow posts one quest and one
// vote, so after it the board is no longer the demo board. Restart the API to reseed it (see README.md).
//
// Usage, from e2e/showcase:
//   node capture.mjs                  every still
//   SLUGS=board-day,voting-rules node capture.mjs
//   node capture.mjs hero             the video, for gif.mjs (a slug may also be an argument)

import { mkdir, rm, stat, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..');

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:8095').replace(/\/$/, '');

/** Committed images. */
const OUT = process.env.SHOWCASE_OUT ? path.resolve(process.env.SHOWCASE_OUT) : path.join(REPO, 'docs', 'assets', 'screens');
/** Intermediate files that are not committed: the hero video and its cut points. */
const WORK = path.join(here, 'out');
/** The hero recording, its cut points and the marker that tells gif.mjs when the run that produced them started. */
const HERO_VIDEO = path.join(WORK, 'hero.webm');
const HERO_CUT = path.join(WORK, 'hero.json');
const HERO_PALETTE = path.join(WORK, 'hero-palette.png');
const HERO_STARTED = path.join(WORK, 'hero.started');
const DESKTOP = { width: 1600, height: 1000 };
const MOBILE = { width: 390, height: 844 };
/**
 * The window height of the top shots. They use the 1600 pixel width of the other stills, but the post-a-quest form ends about 25 pixels below a 1000 pixel window,
 * so these two windows are 40 pixels taller to keep the whole form, its button included, in the picture. The window is resized, not the capture, because the fixed lighting layers cover only the window.
 */
const TOP_HEIGHT = 1040;
/** The hero is recorded in a smaller window than the stills: the scene is expensive to paint, and a lighter frame keeps the recorder at its full frame rate. The GIF is scaled to about this width anyway. */
const HERO_VIEWPORT = { width: 1280, height: 800 };
/** Raw stills are taken at twice the pixel density, for crisp text. */
const DEVICE_SCALE = 2;
/** The framed composite is rendered at this density. */
const FRAME_SCALE = Number(process.env.SHOWCASE_FRAME_SCALE ?? 1.25);
/** WebP quality of the committed stills, from 0 to 1. */
const WEBP_QUALITY = Number(process.env.SHOWCASE_WEBP_QUALITY ?? 0.88);

/** What the demo profile loads, mirrored from DemoQuests.java. The captures assert on it. */
const DEMO = {
  count: 12,
  headline: 'Medieval-like CAPTCHA: prove you are human by picking the picture with the suspicious peasant.',
  longQuest: 'The Grand Ledger of Quests',
};

/** The quest the hero posts. It is posted with no name, so it rides as anonymous. */
const HERO = {
  quest: 'A moat monitor for rising drawbridges.',
};

const SCHEME_KEY = 'mantine-color-scheme-value';
const ADDRESS = 'code-quests.local';

const log = (...parts) => console.log(...parts);

/** Opens a context for one scheme: the app reads its stored choice before the first paint. */
const openContext = (browser, { scheme, viewport, mobile = false, ...options }) =>
  browser.newContext({
    viewport,
    deviceScaleFactor: DEVICE_SCALE,
    colorScheme: scheme,
    locale: 'en-US',
    timezoneId: 'UTC',
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: 'no-preference',
    ...options,
  });

const rememberScheme = (context, scheme) =>
  context.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage can be blocked, the colorScheme option still applies.
      }
    },
    [SCHEME_KEY, scheme],
  );

/** Reads the first page of the API through the site, the way the browser does. */
const readBoard = async () => {
  const response = await fetch(`${BASE_URL}/api/ideas?size=50&sort=newest`);
  if (!response.ok) throw new Error(`the API answered ${response.status} on ${BASE_URL}/api/ideas`);
  return response.json();
};

/**
 * Fails unless the board is the demo board: the same quests, the newest one first. A stack that was not
 * started with the demo profile, or a hero run that was not followed by an API restart, fails here with
 * the way out in the message.
 */
const assertPristine = async () => {
  const page = await readBoard();
  if (page.totalItems !== DEMO.count || !page.items[0]?.description.startsWith(DEMO.headline)) {
    throw new Error(
      `the board is not the demo board (${page.totalItems} quests, expected ${DEMO.count}). ` +
        'Start the API with SPRING_PROFILES_ACTIVE=demo, or restart it to reseed: the seeder resets the data at every start.',
    );
  }
};

/** Resolves when every finite animation and transition has ended, so a shot is not taken mid entrance. */
const waitForCalm = page =>
  page.waitForFunction(
    () => document.getAnimations().every(animation => animation.effect?.getComputedTiming().iterations === Infinity || animation.playState !== 'running'),
    undefined,
    { timeout: 15_000 },
  );

/** Fails the shot when something loading, transient or unstyled is on screen. */
const assertClean = async (page, { notices = 0 } = {}) => {
  const busy = await page.locator('[aria-busy="true"], [data-testid="idea-list-skeleton"], .mantine-Loader-root').count();
  if (busy > 0) throw new Error(`a loading state is still on screen (${busy})`);

  const toasts = await page.locator('.mantine-Notification-root').count();
  if (toasts !== notices) throw new Error(`${toasts} notices are on screen, expected ${notices}`);

  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return { heading: document.fonts.check('700 20px Cinzel'), body: document.fonts.check('400 16px "Alegreya Sans"') };
  });
  if (!fonts.heading || !fonts.body) throw new Error(`the web fonts are not loaded (${JSON.stringify(fonts)})`);

  const broken = await page.evaluate(() =>
    [...document.images]
      .filter(image => {
        const box = image.getBoundingClientRect();
        const visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
        return visible && (!image.complete || image.naturalWidth === 0);
      })
      .map(image => image.currentSrc || image.src),
  );
  if (broken.length > 0) throw new Error(`images in view are not loaded: ${broken.slice(0, 2).join(', ')}`);
};

/** Waits for the page to be still, takes the pointer out of the way, and checks the page is clean. */
const settle = async (page, { board = false, ...options } = {}) => {
  await page.waitForLoadState('networkidle');
  // The board shots start at the plank that names the board, so the first quests are on screen and not only the form above them.
  await page.evaluate(isBoard => {
    const heading = document.getElementById('quest-board-title');
    const top = isBoard && heading ? heading.getBoundingClientRect().top + window.scrollY - 28 : 0;
    window.scrollTo({ top, behavior: 'instant' });
  }, board);
  await page.mouse.move(2, 2);
  await waitForCalm(page);
  await page.waitForTimeout(500);
  await assertClean(page, options);
};

/** Opens the board and asserts that the demo data is what rendered. */
const openBoard = async page => {
  await page.goto(`${BASE_URL}/`);
  await page.getByText(DEMO.headline, { exact: false }).first().waitFor({ timeout: 20_000 });
  const cards = await page.getByTestId('score').count();
  if (cards !== DEMO.count) throw new Error(`the board shows ${cards} quests, expected ${DEMO.count}`);
};

/** The card that holds a quest, found by a piece of its text. */
const questCard = (page, text) => page.locator('[data-cast]').filter({ hasText: text });

/** The inventory. Every shot runs in its own context, so no state leaks from one to the next. */
const SHOTS = [
  {
    slug: 'top-day',
    title: ADDRESS,
    scheme: 'light',
    windowHeight: TOP_HEIGHT,
    run: async page => {
      await openBoard(page);
      await settle(page);
      await assertTop(page);
    },
  },
  {
    slug: 'top-night',
    title: ADDRESS,
    scheme: 'dark',
    // The fire flickers: the shot is retaken until both flames are bright at the moment of the capture.
    brightFlames: true,
    windowHeight: TOP_HEIGHT,
    run: async page => {
      await openBoard(page);
      await settle(page);
      await assertTop(page);
      await assertFlamesLit(page);
    },
  },
  {
    slug: 'board-day',
    title: ADDRESS,
    scheme: 'light',
    run: async page => {
      await openBoard(page);
      await settle(page, { board: true });
    },
  },
  {
    slug: 'board-night',
    title: ADDRESS,
    scheme: 'dark',
    run: async page => {
      await openBoard(page);
      await settle(page, { board: true });
      await assertFlamesLit(page);
    },
  },
  {
    slug: 'quest-expanded',
    title: ADDRESS,
    scheme: 'light',
    run: async page => {
      await openBoard(page);
      const card = questCard(page, DEMO.longQuest);
      await card.getByRole('button', { name: /read more/i }).click();
      await card.getByRole('button', { name: /show less/i }).waitFor();
      await page.waitForLoadState('networkidle');
      await card.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.mouse.move(2, 2);
      await waitForCalm(page);
      await page.waitForTimeout(500);
      await assertClean(page);
    },
  },
  {
    slug: 'post-quest-errors',
    title: ADDRESS,
    scheme: 'light',
    run: async page => {
      await openBoard(page);
      await page.getByRole('textbox', { name: 'Your name' }).fill('Sir Reginald Bartholomew Wigglesworth of the Seventeen Misplaced Semicolons');
      await page.getByRole('textbox', { name: 'The quest' }).fill('Too short');
      await page.getByRole('button', { name: 'Post the quest' }).click();
      const errors = await page.locator('.mantine-InputWrapper-error').count();
      if (errors < 2) throw new Error(`expected validation errors on both fields, found ${errors}`);
      await settle(page);
    },
  },
  {
    slug: 'voting-rules',
    title: ADDRESS,
    scheme: 'dark',
    run: async page => {
      await openBoard(page);
      await page.getByRole('button', { name: 'Voting rules' }).click();
      await page.getByRole('dialog').getByText('I accept my destiny').waitFor();
      await settle(page);
    },
  },
  {
    slug: 'mobile-day',
    title: ADDRESS,
    scheme: 'light',
    mobile: true,
    run: async page => {
      await openBoard(page);
      await settle(page, { board: true });
    },
  },
  {
    slug: 'mobile-night',
    title: ADDRESS,
    scheme: 'dark',
    mobile: true,
    run: async page => {
      await openBoard(page);
      await settle(page, { board: true });
      await assertFlamesLit(page);
    },
  },
];

/** Every slug that can be asked for: the stills and the hero video. */
const SLUGS = [...SHOTS.map(shot => shot.slug), 'hero'];

/** Fails when the scene is at night but no flame is drawn, which would make a night shot a dark day shot. */
const assertFlamesLit = async page => {
  const flames = await page.locator('[data-light-source]').count();
  if (flames === 0) throw new Error('no flame is drawn in the night scene');
  const lit = await page.evaluate(() => {
    const dark = document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark';
    const intensities = [...document.querySelectorAll('[style*="--torch-i"], [style*="--candle-i"], [style*="--lantern-i"]')].length;
    return dark && intensities > 0;
  });
  if (!lit) throw new Error('the night scene is not lit: the color scheme is not dark or no light has been applied');
};

/** The two side lights of the top of the board, whose intensity is the flicker. */
const SIDE_LIGHTS = ['torch', 'lantern'];

/** The lowest intensity, from 0 to 1, at which a side light counts as bright. */
const BRIGHT_FLAME = 0.9;

/** Reads the current intensity of each side light from the custom properties the flicker writes. */
const readSideLights = page =>
  page.evaluate(
    lights =>
      Object.fromEntries(
        lights.map(light => {
          const holder = document.querySelector(`[style*="--${light}-i"]`);
          return [light, holder ? Number(holder.style.getPropertyValue(`--${light}-i`)) : 0];
        }),
      ),
    SIDE_LIGHTS,
  );

/** Resolves when the intensities of both side lights are at least BRIGHT_FLAME, polling faster than the flicker updates. */
const waitForBrightFlames = async (page, timeout = 20_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const lights = await readSideLights(page);
    if (SIDE_LIGHTS.every(light => lights[light] >= BRIGHT_FLAME)) return lights;
    await page.waitForTimeout(15);
  }
  throw new Error('the torch and the lantern were never bright together');
};

/** Fails unless the page is at the very top with the sign, the tagline, the intro plank and the post-a-quest form in view, and nothing focused. */
const assertTop = async (page, height = TOP_HEIGHT) => {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  const state = await page.evaluate(height => {
    const inView = element => {
      if (!element) return false;
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.top >= 0 && box.bottom <= height;
    };
    const form = document.querySelector('form');
    const submit = [...document.querySelectorAll('button')].find(button => /post the quest/i.test(button.textContent ?? ''));
    return {
      scrollY: window.scrollY,
      heading: inView(document.querySelector('h1')),
      form: inView(form) && inView(submit),
      focused: document.activeElement && document.activeElement !== document.body ? document.activeElement.tagName : null,
      focusRings: document.querySelectorAll(':focus-visible').length,
    };
  }, height);
  if (state.scrollY !== 0) throw new Error(`the page is not at the very top (${state.scrollY})`);
  if (!state.heading) throw new Error('the title sign is not fully in view');
  if (!state.form) throw new Error('the post-a-quest form is not fully in view');
  if (state.focused || state.focusRings > 0) throw new Error('something has focus on screen');
};

/** The slugs this run takes. The hero is only recorded when it is named. */
const selectSlugs = () => {
  const requested = [process.env.SLUGS ?? '', ...process.argv.slice(2)]
    .flatMap(list => list.split(','))
    .map(slug => slug.trim())
    .filter(Boolean);

  const unknown = requested.filter(slug => !SLUGS.includes(slug));
  if (unknown.length > 0) {
    throw new Error(`Unknown slug ${unknown.join(', ')}. Known slugs: ${SLUGS.join(', ')}`);
  }

  return requested.length > 0 ? requested : SHOTS.map(shot => shot.slug);
};

const stripDataUrl = dataUrl => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

const pngDataUrl = png => `data:image/png;base64,${png.toString('base64')}`;

/** Puts a raw screenshot in the frame and returns the framed PNG. */
const frameShot = async (framePage, raw, options) => {
  await framePage.evaluate(shot => window.placeShot(shot), { src: pngDataUrl(raw), ...options });
  return framePage.locator('#stage').screenshot({ type: 'png' });
};

/** Re-encodes a PNG as WebP in the browser, which keeps the stills small without another tool. */
const toWebp = async (framePage, png) => stripDataUrl(await framePage.evaluate(([src, quality]) => window.toWebp(src, quality), [pngDataUrl(png), WEBP_QUALITY]));

const kilobytes = async file => `${Math.round((await stat(file)).size / 1024)} KB`;

const takeStill = async (browser, framePage, shot) => {
  const viewport = shot.mobile ? MOBILE : shot.windowHeight ? { ...DESKTOP, height: shot.windowHeight } : DESKTOP;
  const context = await openContext(browser, { scheme: shot.scheme, viewport, mobile: shot.mobile });
  await rememberScheme(context, shot.scheme);
  const page = await context.newPage();

  try {
    await shot.run(page);
    const capture = () =>
      page.screenshot({ type: 'png' });
    let raw = await capture();
    if (shot.brightFlames) {
      // The light moves between the wait and the capture, so the intensity is read again right after it, and the capture is repeated when it dimmed.
      for (let attempt = 1; ; attempt += 1) {
        await waitForBrightFlames(page);
        raw = await capture();
        const after = await readSideLights(page);
        if (SIDE_LIGHTS.every(light => after[light] >= BRIGHT_FLAME)) break;
        if (attempt >= 20) throw new Error('could not capture the torch and the lantern bright');
      }
    }
    const framed = await frameShot(framePage, raw, {
      title: shot.title,
      width: viewport.width,
      scheme: shot.scheme,
      device: shot.mobile ? 'phone' : 'desktop',
    });

    await writeFile(path.join(OUT, `${shot.slug}.raw.webp`), await toWebp(framePage, raw));
    await writeFile(path.join(OUT, `${shot.slug}.framed.webp`), await toWebp(framePage, framed));
  } finally {
    await context.close();
  }
};

/** A dot that follows the pointer, since a recording does not show the system cursor. */
const CURSOR_SCRIPT = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgb(242 196 107 / 0.9);border:3px solid #241811;box-shadow:0 2px 8px rgb(0 0 0 / 0.5);' +
      'pointer-events:none;z-index:2147483647;transform:translate(-100px,-100px)';
    document.body.append(dot);
    window.addEventListener(
      'mousemove',
      event => {
        dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      },
      true,
    );
    window.addEventListener('mousedown', () => (dot.style.scale = '0.8'), true);
    window.addEventListener('mouseup', () => (dot.style.scale = '1'), true);
  });
};

/** Scrolls the page to a position along an eased path, so the recording shows a glide and not a jump. */
const glideTo = (page, top, milliseconds) =>
  page.evaluate(
    ([target, duration]) =>
      new Promise(resolve => {
        const start = window.scrollY;
        const began = performance.now();
        const step = now => {
          const t = Math.min(1, (now - began) / duration);
          // Mostly linear with a touch of ease: a pure ease crawls at both ends, and the frames there barely differ.
          const eased = 0.8 * t + 0.2 * (t * t * (3 - 2 * t));
          window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [top, milliseconds],
  );

/** Where the last timed pointer move ended, the start of the next one. */
let pointer = { x: 0, y: 0 };

/** Moves the pointer to the middle of an element along a path of small steps, spread over `milliseconds` when given. */
const moveToElement = async (page, locator, steps = 24, milliseconds = 0) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('the element to point at is not rendered');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (milliseconds === 0) {
    await page.mouse.move(x, y, { steps });
  } else {
    // Pointer events spread in time, so every frame of the recording shows the pointer somewhere new.
    const from = pointer;
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      await page.mouse.move(from.x + (x - from.x) * eased, from.y + (y - from.y) * eased);
      await page.waitForTimeout(milliseconds / steps);
    }
  }
  pointer = { x, y };
};

/**
 * The hero runs in the full Chromium build in its new headless mode, not in the headless shell that
 * Playwright launches by default: the shell rasterizes in software, which is slow for a page with this
 * much light, and the video shows it as stutter. The full build renders at the display rate.
 */
const launchHeroBrowser = () => chromium.launch({ channel: 'chromium' });

const recordHero = async () => {
  const dir = path.join(WORK, 'video');
  // A failed run must leave nothing for gif.mjs to convert: the previous recording, its cut points and any partial video go first.
  await Promise.all([dir, HERO_VIDEO, HERO_CUT, HERO_PALETTE].map(target => rm(target, { recursive: true, force: true })));
  await writeFile(HERO_STARTED, new Date().toISOString());

  const browser = await launchHeroBrowser();
  const context = await openContext(browser, {
    scheme: 'dark',
    viewport: HERO_VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir, size: HERO_VIEWPORT },
  });
  await rememberScheme(context, 'dark');
  await context.addInitScript(CURSOR_SCRIPT);

  const page = await context.newPage();
  const recordingStarted = Date.now();
  /** Named stretches of the recording, in seconds from its start: `glide` is the page scrolling to the board, `stamp` is the wax seal pressed after the vote. gif.mjs measures smoothness over them. */
  const motion = {};

  try {
    await openBoard(page);
    await settle(page);
    await assertFlamesLit(page);

    // The footage before this moment is the page loading, and gif.mjs cuts it.
    const startAt = (Date.now() - recordingStarted) / 1000 + 0.2;
    await page.waitForTimeout(250);

    // Fill in the quest, typed at a readable speed. The name is left blank: the quest rides as anonymous.
    const quest = page.getByRole('textbox', { name: 'The quest' });
    await moveToElement(page, quest, 14);
    await quest.click();
    await page.keyboard.type(HERO.quest, { delay: 16 });
    await page.waitForTimeout(250);

    // Post it. The new quest is the newest, so it is pinned at the head of the board.
    const submit = page.getByRole('button', { name: 'Post the quest' });
    await moveToElement(page, submit, 14);
    await page.waitForTimeout(150);
    await submit.click();
    const card = questCard(page, HERO.quest);
    await card.waitFor({ timeout: 10_000 });

    // Bring the board into view with its candle, then back the new quest. The seal is stamped with the new score.
    await page.waitForTimeout(350);
    // The "Quest posted" notice has been seen by now. It would sit over the board's top corner for the rest of the clip.
    await page.locator('.mantine-Notification-closeButton').first().evaluate(button => button.click());
    await page.locator('.mantine-Notification-root').waitFor({ state: 'detached', timeout: 5_000 });
    const boardTop = await page.evaluate(() => document.getElementById('quest-board-title').getBoundingClientRect().top + window.scrollY);
    const elapsed = () => (Date.now() - recordingStarted) / 1000;
    const glideFrom = elapsed();
    await glideTo(page, Math.max(0, boardTop - 190), 1200);
    motion.glide = [glideFrom, elapsed()];
    await page.waitForTimeout(200);

    const back = card.getByRole('button', { name: 'Back this quest' });
    await moveToElement(page, back, 28, 700);
    await page.waitForTimeout(250);
    const stampFrom = elapsed();
    await back.click();
    await card.getByTestId('score').getByText('1', { exact: true }).waitFor({ timeout: 8_000 });
    // The seal's press lasts a fraction of a second after the new score appears.
    await page.waitForTimeout(600);
    motion.stamp = [stampFrom, elapsed()];

    // Let the stamp land and the flames keep burning before the cut.
    await page.mouse.move(HERO_VIEWPORT.width - 40, HERO_VIEWPORT.height / 2, { steps: 12 });
    await page.waitForTimeout(500);
    const endAt = (Date.now() - recordingStarted) / 1000;

    await context.close();
    const video = await page.video().path();
    await copyFile(video, HERO_VIDEO);
    await writeFile(HERO_CUT,JSON.stringify({ start: Number(startAt.toFixed(2)), end: Number(endAt.toFixed(2)), motion: Object.fromEntries(Object.entries(motion).map(([name, window]) => [name, window.map(second => Number(second.toFixed(2)))])) }));
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
};

const main = async () => {
  const slugs = selectSlugs();
  const stills = SHOTS.filter(shot => slugs.includes(shot.slug));

  await mkdir(WORK, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const failures = [];
  const report = (slug, ok, detail) => {
    log(`${ok ? 'OK  ' : 'FAIL'} ${slug}${detail ? `  ${detail}` : ''}`);
    if (!ok) failures.push(slug);
  };

  // A stack that is not the demo stack makes every shot meaningless, so it stops the run before any browser opens.
  await assertPristine();

  const browser = await chromium.launch();
  try {
    const frameContext = await browser.newContext({ viewport: { width: 2000, height: 1500 }, deviceScaleFactor: FRAME_SCALE });
    const framePage = await frameContext.newPage();
    await framePage.goto(pathToFileURL(path.join(here, 'frame.html')).href);

    for (const shot of stills) {
      try {
        await takeStill(browser, framePage, shot);
        report(shot.slug, true, `${await kilobytes(path.join(OUT, `${shot.slug}.framed.webp`))} framed, ${await kilobytes(path.join(OUT, `${shot.slug}.raw.webp`))} raw`);
      } catch (error) {
        report(shot.slug, false, error.message.split('\n')[0]);
      }
    }
  } finally {
    await browser.close();
  }

  // The hero comes last: it posts a quest, so the board is no longer the demo board afterwards.
  if (slugs.includes('hero')) {
    try {
      await recordHero();
      report('hero', true, 'recorded, run gif.mjs to convert it. Restart the API to reseed the demo board.');
    } catch (error) {
      report('hero', false, error.message.split('\n')[0]);
    }
  }

  if (failures.length > 0) {
    log(`\n${failures.length} failed: ${failures.join(', ')}`);
    process.exit(1);
  }
  log('\nAll shots captured.');
};

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});

// Converts the video that `node capture.mjs hero` records into the README animation:
// a GIF built with a two pass palette, and an MP4. Then it measures how smooth the MP4 is.
//
// The GIF is 20 frames a second at 1100 pixels wide, trimmed to the part of the recording that shows
// the flow (capture.mjs writes the cut points beside the video). It must stay under 8 MB, which is what
// a README can carry without slowing the page. The MP4 is 25 frames a second.
//
// Smoothness is measured on the MP4 with ffmpeg's mpdecimate filter, which drops a frame that is
// nearly identical to the one before it. The frames that survive are the distinct ones, and the run
// fails when fewer than MIN_DISTINCT_FPS of them fall in a second of the stretches in which the page
// moves (capture.mjs records them beside the video). The average over the whole clip is printed too,
// but it counts the pauses, where only a flame flickers, and mpdecimate treats that as a repeat.
//
// ffmpeg is found through FFMPEG, then the PATH.
//
// Usage, from e2e/showcase: node gif.mjs

import { spawnSync } from 'node:child_process';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, 'out');
const OUT = process.env.SHOWCASE_OUT ? path.resolve(process.env.SHOWCASE_OUT) : path.resolve(here, '..', '..', 'docs', 'assets', 'screens');

const GIF_FPS = 20;
const MP4_FPS = 25;
/** GIF widths to try in pixels, widest first. */
const WIDTHS = [1100, 1040, 980];
const MAX_GIF_BYTES = 8 * 1024 * 1024;
const MIN_DISTINCT_FPS = 20;
/** GIF palette sizes to try, largest first. */
const PALETTE_SIZES = [128, 96, 80, 64, 48];

const fail = message => {
  console.error(`FAIL ${message}`);
  process.exit(1);
};

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const probe = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  fail(
    `ffmpeg was not found (tried "${ffmpeg}"). Install it (winget install Gyan.FFmpeg, brew install ffmpeg or apt install ffmpeg) ` +
      'and open a new terminal, or point FFMPEG at the executable.',
  );
}

/** Runs ffmpeg and stops with its last lines when it fails. */
const run = (label, args) => {
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`ffmpeg failed while ${label}:\n${(result.stderr || result.stdout || '').trim().split('\n').slice(-8).join('\n')}`);
  }
};

const video = path.join(WORK, 'hero.webm');
const cutFile = path.join(WORK, 'hero.json');
const startedFile = path.join(WORK, 'hero.started');
let cut;

// capture.mjs deletes the previous recording and writes the marker when a hero run starts. A recording that is missing, or older than
// the marker, belongs to a run that did not finish, and converting it would publish a stale animation.
const modified = async file => {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return null;
  }
};
const [videoTime, cutTime, startedTime] = await Promise.all([modified(video), modified(cutFile), modified(startedFile)]);
if (videoTime === null || cutTime === null) {
  fail(`No complete recording in ${WORK} (needs hero.webm and hero.json). Record it first: node capture.mjs hero`);
}
if (startedTime === null) {
  fail(`No ${startedFile}, so the recording cannot be tied to a finished run. Record it again: node capture.mjs hero`);
}
if (videoTime < startedTime || cutTime < startedTime) {
  fail('The recording is older than the latest hero run, which did not finish. Record it again: node capture.mjs hero');
}
try {
  cut = JSON.parse(await readFile(cutFile, 'utf8'));
} catch {
  fail(`${cutFile} is not readable JSON. Record the hero again: node capture.mjs hero`);
}

await mkdir(OUT, { recursive: true });

const palette = path.join(WORK, 'hero-palette.png');
const gif = path.join(OUT, 'hero.gif');
const mp4 = path.join(OUT, 'hero.mp4');
const trim = ['-ss', String(cut.start), '-to', String(cut.end), '-i', video];
// The recorder's video codec leaves noise on every frame, and a GIF stores each changed pixel again.
// A light temporal denoise before the scale keeps the unchanged parts of the board identical from
// frame to frame, which is most of what the GIF can save.
const filters = width => `fps=${GIF_FPS},hqdn3d=10:8:20:14,scale=${width}:-1:flags=lanczos`;

/**
 * Encodes the GIF with a two pass palette of the given size. Pass one reads the whole clip and picks
 * the colors that suit it, weighting what moves over the static page. Pass two draws every frame with
 * that palette. Bayer dithering keeps the gradients from banding and compresses far better than error diffusion.
 */
const encodeGif = (colors, width) => {
  run('building the palette', [...trim, '-vf', `${filters(width)},palettegen=max_colors=${colors}:stats_mode=diff`, palette]);
  run('encoding the GIF', [...trim, '-i', palette, '-lavfi', `${filters(width)} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`, '-loop', '0', gif]);
};

// A larger palette and a wider picture look better and weigh more. Take the widest picture, then the
// largest palette, that fits the budget: the width gives way only when no palette fits.
let fits = false;
for (const width of WIDTHS) {
  for (const colors of PALETTE_SIZES) {
    encodeGif(colors, width);
    fits = (await stat(gif)).size <= MAX_GIF_BYTES;
    if (fits) break;
  }
  if (fits) break;
}

run('encoding the MP4', [
  ...trim,
  '-vf',
  `fps=${MP4_FPS}`,
  '-c:v',
  'libx264',
  '-crf',
  '22',
  '-preset',
  'slow',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-an',
  mp4,
]);

const size = async file => (await stat(file)).size;
const megabytes = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** Counts the distinct frames in each second of the MP4. */
const measureSmoothness = () => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-i', mp4, '-vf', 'mpdecimate,showinfo', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const times = [...(result.stderr ?? '').matchAll(/pts_time:([\d.]+)/g)].map(match => Number(match[1]));
  if (times.length === 0) fail('could not measure the distinct frames of the MP4');

  const seconds = Math.ceil(Math.max(...times) + 1e-6);
  const perSecond = Array.from({ length: seconds }, () => 0);
  for (const time of times) perSecond[Math.min(seconds - 1, Math.floor(time))] += 1;

  const duration = cut.end - cut.start;

  // The named stretches of motion, on the MP4's own timeline, each with its distinct frames a second.
  const windows = Object.fromEntries(
    Object.entries(cut.motion ?? {}).map(([name, [from, to]]) => {
      const start = Math.max(0, from - cut.start);
      const end = to - cut.start;
      const frames = times.filter(time => time >= start && time < end).length;
      return [name, { seconds: end - start, rate: end > start ? frames / (end - start) : 0 }];
    }),
  );

  return { distinct: times.length, duration, average: times.length / duration, perSecond, windows };
};

const gifBytes = await size(gif);
console.log(`OK   hero.gif  ${megabytes(gifBytes)}`);
console.log(`OK   hero.mp4  ${megabytes(await size(mp4))}`);

const smooth = measureSmoothness();
console.log(`     ${smooth.distinct} distinct frames in ${smooth.duration.toFixed(1)} s: ${smooth.average.toFixed(1)} a second on average`);
console.log(`     per second: ${smooth.perSecond.join(' ')}`);
for (const [name, { seconds, rate }] of Object.entries(smooth.windows)) {
  console.log(`     ${name} (${seconds.toFixed(1)} s): ${rate.toFixed(1)} a second`);
}

if (gifBytes > MAX_GIF_BYTES) {
  fail(`hero.gif is ${megabytes(gifBytes)}, over the ${megabytes(MAX_GIF_BYTES)} limit. Lower GIF_FPS or the WIDTHS in gif.mjs, or shorten the flow.`);
}
// The glide moves the whole page, so every frame must differ. The stamp is a small animation and is reported only.
const glide = smooth.windows.glide;
if (!glide || glide.rate < MIN_DISTINCT_FPS) {
  fail(`the scroll glide has ${glide ? glide.rate.toFixed(1) : 'no'} distinct frames a second, under ${MIN_DISTINCT_FPS}. Record the hero again in the full Chromium build.`);
}

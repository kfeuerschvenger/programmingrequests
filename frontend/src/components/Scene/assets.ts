import chain from '@/assets/scene/chain.webp';
import chain2x from '@/assets/scene/chain@2x.webp';
import candle from '@/assets/scene/candle-unlit.webp';
import candle2x from '@/assets/scene/candle-unlit@2x.webp';
import dagger from '@/assets/scene/dagger-stuck.webp';
import dagger2x from '@/assets/scene/dagger-stuck@2x.webp';
import inkBlot1 from '@/assets/scene/ink-blot-1.webp';
import inkBlot1x2 from '@/assets/scene/ink-blot-1@2x.webp';
import inkBlot2 from '@/assets/scene/ink-blot-2.webp';
import inkBlot2x2 from '@/assets/scene/ink-blot-2@2x.webp';
import inkBlot3 from '@/assets/scene/ink-blot-3.webp';
import inkBlot3x2 from '@/assets/scene/ink-blot-3@2x.webp';
import inkwell from '@/assets/scene/inkwell-quill.webp';
import inkwell2x from '@/assets/scene/inkwell-quill@2x.webp';
import lantern from '@/assets/scene/lantern-unlit.webp';
import lantern2x from '@/assets/scene/lantern-unlit@2x.webp';
import nailAngled from '@/assets/scene/nail-angled.webp';
import nailAngled2x from '@/assets/scene/nail-angled@2x.webp';
import nailBent from '@/assets/scene/nail-bent.webp';
import nailBent2x from '@/assets/scene/nail-bent@2x.webp';
import nailFlush from '@/assets/scene/nail-flush.webp';
import nailFlush2x from '@/assets/scene/nail-flush@2x.webp';
import nailHalf from '@/assets/scene/nail-half.webp';
import nailHalf2x from '@/assets/scene/nail-half@2x.webp';
import paperMap from '@/assets/scene/paper-map.webp';
import paperMap2x from '@/assets/scene/paper-map@2x.webp';
import paperSwordShield from '@/assets/scene/paper-sword-shield.webp';
import paperSwordShield2x from '@/assets/scene/paper-sword-shield@2x.webp';
import pinBrass from '@/assets/scene/pin-brass.webp';
import pinBrass2x from '@/assets/scene/pin-brass@2x.webp';
import rope from '@/assets/scene/rope-coil.webp';
import rope2x from '@/assets/scene/rope-coil@2x.webp';
import scratches1 from '@/assets/scene/scratches-1.webp';
import scratches1x2 from '@/assets/scene/scratches-1@2x.webp';
import scratches2 from '@/assets/scene/scratches-2.webp';
import scratches2x2 from '@/assets/scene/scratches-2@2x.webp';
import torch from '@/assets/scene/torch-unlit.webp';
import torch2x from '@/assets/scene/torch-unlit@2x.webp';

export interface SceneImage {
  src: string;
  srcSet: string;
  /** Natural size at 1x, which is also the aspect ratio. */
  width: number;
  height: number;
}

const image = (one: string, two: string, width: number, height: number): SceneImage => ({
  src: one,
  srcSet: `${one} 1x, ${two} 2x`,
  width,
  height,
});

/** The scene images used from markup. The ones painted from stylesheets are declared in styles/scene.css. */
export const art = {
  chain: image(chain, chain2x, 48, 180),
  rope: image(rope, rope2x, 105, 180),
  torch: image(torch, torch2x, 54, 180),
  lantern: image(lantern, lantern2x, 82, 150),
  candle: image(candle, candle2x, 109, 120),
  inkwell: image(inkwell, inkwell2x, 62, 110),
  dagger: image(dagger, dagger2x, 160, 138),
  nailFlush: image(nailFlush, nailFlush2x, 54, 48),
  nailHalf: image(nailHalf, nailHalf2x, 25, 48),
  nailBent: image(nailBent, nailBent2x, 24, 48),
  nailAngled: image(nailAngled, nailAngled2x, 30, 48),
  pinBrass: image(pinBrass, pinBrass2x, 53, 48),
  paperMap: image(paperMap, paperMap2x, 240, 199),
  paperSwordShield: image(paperSwordShield, paperSwordShield2x, 240, 254),
  scratches1: image(scratches1, scratches1x2, 160, 185),
  scratches2: image(scratches2, scratches2x2, 160, 177),
  inkBlot1: image(inkBlot1, inkBlot1x2, 160, 149),
  inkBlot2: image(inkBlot2, inkBlot2x2, 160, 159),
  inkBlot3: image(inkBlot3, inkBlot3x2, 160, 167),
} as const;

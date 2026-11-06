import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The Docker build context is frontend/, so the image served to link previews has to live inside it. The brand copy under docs/ is the source of truth, and both files must stay identical.
const served = path.resolve(import.meta.dirname, 'public', 'social-preview.png');
const source = path.resolve(import.meta.dirname, '..', 'docs', 'assets', 'brand', 'social-preview.png');

describe('social preview image', () => {
  it('is byte-identical in public/ and in docs/assets/brand/', ctx => {
    if (!fs.existsSync(source)) {
      ctx.skip(`docs/assets/brand/social-preview.png is missing (sparse checkout), nothing to compare with ${served}`);
    }

    expect(fs.readFileSync(served).equals(fs.readFileSync(source))).toBe(true);
  });
});

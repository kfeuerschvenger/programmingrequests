import { describe, expect, it } from 'vitest';
import { fontPreloadTags } from './vite.preload-fonts.ts';

const FILES = [
  'assets/index-AbC123.js',
  'assets/Cinzel-latin-1a2b3c.woff2',
  'assets/AlegreyaSans-Regular-latin-4d5e6f.woff2',
  'assets/AlegreyaSans-Medium-latin-7a8b9c.woff2',
  'assets/AlegreyaSans-Bold-latin-0d1e2f.woff2',
];

describe('fontPreloadTags', () => {
  it('preloads Cinzel and Alegreya Sans Regular with the crossorigin attribute fonts require', () => {
    const tags = fontPreloadTags(FILES);

    expect(tags.map(tag => tag.attrs?.href)).toEqual([
      '/assets/Cinzel-latin-1a2b3c.woff2',
      '/assets/AlegreyaSans-Regular-latin-4d5e6f.woff2',
    ]);
    for (const tag of tags) {
      expect(tag.tag).toBe('link');
      expect(tag.attrs).toMatchObject({ rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '' });
    }
  });

  it('prefixes the base path', () => {
    expect(fontPreloadTags(FILES, '/quests/')[0]?.attrs?.href).toBe('/quests/assets/Cinzel-latin-1a2b3c.woff2');
  });

  it('makes no tag for a font that was inlined and has no file', () => {
    expect(fontPreloadTags(['assets/index-AbC123.js'])).toEqual([]);
  });
});

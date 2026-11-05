import { describe, expect, it } from 'vitest';
import { socialMetaTags } from './vite.social-meta.ts';

const contentOf = (tags: ReturnType<typeof socialMetaTags>, key: string) =>
  tags.find(t => t.attrs?.property === key || t.attrs?.name === key)?.attrs?.content;

describe('socialMetaTags', () => {
  it('emits no tags when the site URL is unset or blank', () => {
    expect(socialMetaTags(undefined)).toEqual([]);
    expect(socialMetaTags('   ')).toEqual([]);
  });

  it('builds absolute image and page URLs from the origin', () => {
    const tags = socialMetaTags('https://quests.example.com');
    expect(contentOf(tags, 'og:image')).toBe('https://quests.example.com/social-preview.png');
    expect(contentOf(tags, 'twitter:image')).toBe('https://quests.example.com/social-preview.png');
    expect(contentOf(tags, 'og:url')).toBe('https://quests.example.com/');
  });

  it('does not double the slash when the URL ends with one', () => {
    expect(contentOf(socialMetaTags('https://quests.example.com/'), 'og:image')).toBe(
      'https://quests.example.com/social-preview.png',
    );
  });

  it.each(['quests.example.com', 'ftp://quests.example.com', 'javascript:alert(1)'])('rejects %s', value => {
    expect(() => socialMetaTags(value)).toThrow(/absolute http\(s\) URL/);
  });
});

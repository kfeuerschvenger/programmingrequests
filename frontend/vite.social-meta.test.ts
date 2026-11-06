import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import { socialMeta, socialMetaTags } from './vite.social-meta.ts';

const contentOf = (tags: HtmlTagDescriptor[], key: string) =>
  tags.find(t => t.attrs?.property === key || t.attrs?.name === key)?.attrs?.content;

// A fresh, empty directory per test: a stray .env in a shared temp directory cannot change the result.
let envDir = '';
let config: ResolvedConfig;

beforeEach(() => {
  envDir = mkdtempSync(path.join(os.tmpdir(), 'social-meta-'));
  config = { mode: 'test', root: envDir, envDir } as ResolvedConfig;
});

/** Drives the plugin the way Vite does: configResolved once, then transformIndexHtml. */
function runPlugin(siteUrl: string): { plugin: Plugin; resolve: () => void; tags: () => HtmlTagDescriptor[] } {
  vi.stubEnv('VITE_SITE_URL', siteUrl);
  const plugin = socialMeta();
  return {
    plugin,
    resolve: () => (plugin.configResolved as (c: ResolvedConfig) => void).call({} as never, config),
    tags: () => (plugin.transformIndexHtml as () => HtmlTagDescriptor[]).call({} as never),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(envDir, { recursive: true, force: true });
});

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

  it('emits the image alt tags together with the image tags', () => {
    const tags = socialMetaTags('https://quests.example.com');
    expect(contentOf(tags, 'og:image:alt')).toBeTruthy();
    expect(contentOf(tags, 'twitter:image:alt')).toBeTruthy();
  });

  it('trims trailing slashes', () => {
    expect(contentOf(socialMetaTags('https://quests.example.com/'), 'og:image')).toBe(
      'https://quests.example.com/social-preview.png',
    );
    expect(contentOf(socialMetaTags('https://quests.example.com/app//'), 'og:url')).toBe(
      'https://quests.example.com/app/',
    );
  });

  it('keeps a path prefix', () => {
    const tags = socialMetaTags('https://example.com/quests/');
    expect(contentOf(tags, 'og:image')).toBe('https://example.com/quests/social-preview.png');
    expect(contentOf(tags, 'og:url')).toBe('https://example.com/quests/');
  });

  it.each([
    ['quests.example.com', /absolute http\(s\) URL/],
    ['ftp://quests.example.com', /absolute http\(s\) URL/],
    ['javascript:alert(1)', /absolute http\(s\) URL/],
    ['https://quests.example.com/?a=1', /query string/],
    ['https://quests.example.com/?', /query string/],
    ['https://quests.example.com/#top', /hash/],
    ['https://quests.example.com/#', /hash/],
    ['https://user:secret@quests.example.com', /credentials/],
    ['https://user@quests.example.com', /credentials/],
  ])('rejects %s', (value, message) => {
    expect(() => socialMetaTags(value)).toThrow(message);
  });
});

describe('socialMeta plugin', () => {
  it.each([
    ['https://quests.example.com/?a=1', /query string/],
    ['https://quests.example.com/#top', /hash/],
    ['https://user:secret@quests.example.com', /credentials/],
    ['ftp://quests.example.com', /absolute http\(s\) URL/],
  ])('fails in configResolved for %s', (value, message) => {
    const { resolve } = runPlugin(value);
    expect(resolve).toThrow(message);
  });

  it('accepts a valid URL in configResolved and keeps the path prefix', () => {
    const { resolve, tags } = runPlugin('https://example.com/quests/');
    expect(resolve).not.toThrow();
    expect(contentOf(tags(), 'og:image')).toBe('https://example.com/quests/social-preview.png');
  });

  it('emits the image tags and both alt tags when the variable is set', () => {
    const { resolve, tags } = runPlugin('https://quests.example.com');
    resolve();
    const out = tags();
    expect(contentOf(out, 'og:image')).toBe('https://quests.example.com/social-preview.png');
    expect(contentOf(out, 'og:image:alt')).toBeTruthy();
    expect(contentOf(out, 'twitter:image:alt')).toBeTruthy();
  });

  it('emits nothing, alt tags included, when the variable is unset', () => {
    const { resolve, tags } = runPlugin('');
    expect(resolve).not.toThrow();
    expect(tags()).toEqual([]);
  });
});

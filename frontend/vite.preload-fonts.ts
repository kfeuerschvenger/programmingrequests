import type { HtmlTagDescriptor, Plugin } from 'vite';

/** The two faces every first paint needs: the title font and the body text. Bold and Medium are used later or lower on the page and load when the stylesheet asks for them. */
const CRITICAL_FONTS = [/^Cinzel-latin-.+\.woff2$/, /^AlegreyaSans-Regular-latin-.+\.woff2$/];

/**
 * Builds the preload tags for the critical fonts from the names of the emitted files. The hashed names are known only once the bundle exists, so they cannot be written in index.html by hand.
 * A font preload needs `crossorigin` even on the same origin, because fonts are fetched in CORS mode: without it the preloaded file is ignored and fetched a second time.
 * A font that the bundler inlined as a data URI has no file, and no tag is made for it.
 */
export function fontPreloadTags(fileNames: readonly string[], base = '/'): HtmlTagDescriptor[] {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return CRITICAL_FONTS.flatMap(pattern => {
    const fileName = fileNames.find(name => pattern.test(name.split('/').pop() ?? ''));
    if (!fileName) return [];
    return [
      {
        tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${prefix}${fileName}`, crossorigin: '' },
        injectTo: 'head' as const,
      },
    ];
  });
}

/** Adds the font preload links to index.html in a production build. The dev server serves unhashed names and needs none. */
export function preloadFonts(): Plugin {
  let base = '/';
  return {
    name: 'code-quests-preload-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        return fontPreloadTags(Object.keys(context.bundle ?? {}), base);
      },
    },
  };
}

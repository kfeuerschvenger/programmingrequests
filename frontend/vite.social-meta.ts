import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';

const SOCIAL_IMAGE_PATH = '/social-preview.png';

/**
 * Builds the absolute-URL meta tags that link previews need. Open Graph and Twitter crawlers do not resolve relative URLs, so these tags exist only when the public origin of the site is known at build time.
 * Returns no tags when the origin is blank, and throws when it is not an absolute http or https URL.
 */
export function socialMetaTags(siteUrl: string | undefined): HtmlTagDescriptor[] {
  const raw = siteUrl?.trim();
  if (!raw) {
    return [];
  }

  let origin: URL;
  try {
    origin = new URL(raw);
  } catch {
    throw new Error(`VITE_SITE_URL must be an absolute http(s) URL, received "${raw}"`);
  }
  if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
    throw new Error(`VITE_SITE_URL must be an absolute http(s) URL, received "${raw}"`);
  }

  const base = origin.href.replace(/\/+$/, '');
  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' });

  return [
    meta({ property: 'og:url', content: `${base}/` }),
    meta({ property: 'og:image', content: `${base}${SOCIAL_IMAGE_PATH}` }),
    meta({ property: 'og:image:width', content: '1280' }),
    meta({ property: 'og:image:height', content: '640' }),
    meta({ name: 'twitter:image', content: `${base}${SOCIAL_IMAGE_PATH}` }),
  ];
}

/** Injects og:url, og:image and twitter:image into index.html when VITE_SITE_URL is set, from the process environment or from the .env files. */
export function socialMeta(): Plugin {
  let siteUrl: string | undefined;

  return {
    name: 'code-quests:social-meta',
    configResolved(config) {
      siteUrl = loadEnv(config.mode, config.envDir || config.root, 'VITE_').VITE_SITE_URL;
    },
    transformIndexHtml() {
      return socialMetaTags(siteUrl);
    },
  };
}

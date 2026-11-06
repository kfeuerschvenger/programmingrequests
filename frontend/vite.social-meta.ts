import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';

const SOCIAL_IMAGE_PATH = '/social-preview.png';
const SOCIAL_IMAGE_ALT = 'Code Quests: Post a quest. Let the hero code.';

/**
 * Normalizes the public site URL into a base with no trailing slash: the origin plus any path prefix. Returns undefined when the value is blank.
 * Throws when the value is not an absolute http or https URL, or carries credentials, a query string or a hash, none of which belong in a base that paths are appended to.
 */
export function resolveSiteBase(siteUrl: string | undefined): string | undefined {
  const raw = siteUrl?.trim();
  if (!raw) {
    return undefined;
  }

  const fail = (reason: string) => new Error(`VITE_SITE_URL ${reason}, received "${raw}"`);

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw fail('must be an absolute http(s) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw fail('must be an absolute http(s) URL');
  }
  if (url.username || url.password) {
    throw fail('must not contain credentials');
  }
  if (url.search || raw.includes('?')) {
    throw fail('must not contain a query string');
  }
  if (url.hash || raw.includes('#')) {
    throw fail('must not contain a hash');
  }

  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

/**
 * Builds the absolute-URL meta tags that link previews need. Open Graph and Twitter crawlers do not resolve relative URLs, so these tags exist only when the public site URL is known at build time. The image alt tags are emitted with the image tags, never without them.
 * Returns no tags when the URL is blank, and throws when it is invalid (see resolveSiteBase).
 */
export function socialMetaTags(siteUrl: string | undefined): HtmlTagDescriptor[] {
  const base = resolveSiteBase(siteUrl);
  if (base === undefined) {
    return [];
  }

  const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' });

  return [
    meta({ property: 'og:url', content: `${base}/` }),
    meta({ property: 'og:image', content: `${base}${SOCIAL_IMAGE_PATH}` }),
    meta({ property: 'og:image:width', content: '1280' }),
    meta({ property: 'og:image:height', content: '640' }),
    meta({ property: 'og:image:alt', content: SOCIAL_IMAGE_ALT }),
    meta({ name: 'twitter:image', content: `${base}${SOCIAL_IMAGE_PATH}` }),
    meta({ name: 'twitter:image:alt', content: SOCIAL_IMAGE_ALT }),
  ];
}

/** Injects og:url, the image tags and their alt text into index.html when VITE_SITE_URL is set, from the process environment or from the .env files. The value is validated once when the config resolves, so an invalid one stops both vite build and vite dev. */
export function socialMeta(): Plugin {
  let siteUrl: string | undefined;

  return {
    name: 'code-quests:social-meta',
    configResolved(config) {
      const value = loadEnv(config.mode, config.envDir || config.root, 'VITE_').VITE_SITE_URL;
      resolveSiteBase(value);
      siteUrl = value;
    },
    transformIndexHtml() {
      return socialMetaTags(siteUrl);
    },
  };
}

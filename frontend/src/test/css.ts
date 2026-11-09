/// <reference types="node" />
import { readFileSync } from 'node:fs';

/**
 * The text of a stylesheet, for the few rules happy-dom can not show (container queries, custom properties that only layout resolves).
 * Pass the test's own `import.meta.url` as `from`, so the path is relative to the test file.
 */
export const readCss = (relative: string, from: string): string => readFileSync(new URL(relative, from), 'utf8');

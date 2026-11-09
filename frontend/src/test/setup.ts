import '@testing-library/jest-dom/vitest';
import { notifications } from '@mantine/notifications';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// Mantine reads the color scheme and measures elements, neither of which happy-dom provides.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;

// Autosizing textareas listen for web font loading.
Object.defineProperty(document, 'fonts', {
  value: { addEventListener: () => undefined, removeEventListener: () => undefined },
});

window.HTMLElement.prototype.scrollIntoView = () => undefined;

// A request answered by MSW crosses a simulated socket; the default 1000 ms wait is shorter than that on a busy machine.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error', onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  // The notification store is module-level, so a notification shown by one test would appear in the next one that mounts <Notifications />.
  notifications.clean();
  server.resetHandlers();
});
afterAll(() => server.close());

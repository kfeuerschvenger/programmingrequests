import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: true,
      // Every file gets its own worker and loads happy-dom, React and Mantine: unbounded, 26 of them starve each other and a request answered by MSW takes longer than the default waits.
      maxWorkers: 4,
      testTimeout: 15_000,
      setupFiles: ['./src/test/setup.ts'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
        thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
      },
    },
  }),
);

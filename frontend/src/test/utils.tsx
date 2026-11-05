import type { ReactElement, ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HttpResponse } from 'msw';
import type { Idea, IdeaPage } from '@/types/ideas';

export const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });

interface WrapperOptions {
  client?: QueryClient;
  route?: string;
  withNotifications?: boolean;
}

export const createWrapper = ({
  client = createTestQueryClient(),
  route = '/',
  withNotifications,
}: WrapperOptions = {}) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MantineProvider>
          {withNotifications && <Notifications />}
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    );
  };

export const renderWithProviders = (
  ui: ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) => {
  const client = options.client ?? createTestQueryClient();
  const { route, withNotifications, ...renderOptions } = options;
  return {
    client,
    ...render(ui, { wrapper: createWrapper({ client, route, withNotifications }), ...renderOptions }),
  };
};

export const makeIdea = (overrides: Partial<Idea> = {}): Idea => ({
  id: 1,
  author: 'Ada',
  description: 'Build a tiny dungeon crawler in the terminal.',
  createdAt: '2025-01-01T10:00:00Z',
  score: 3,
  myVote: 0,
  ...overrides,
});

export const makePage = (items: Idea[], overrides: Partial<IdeaPage> = {}): IdeaPage => ({
  items,
  page: 0,
  size: 20,
  totalItems: items.length,
  totalPages: 1,
  ...overrides,
});

export const problem = (status: number, code: string, extra: Record<string, unknown> = {}, headers?: HeadersInit) =>
  HttpResponse.json(
    { type: 'about:blank', title: 'Problem', status, detail: `${code} detail`, code, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json', ...headers } },
  );

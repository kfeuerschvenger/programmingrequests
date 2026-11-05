import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { createWrapper, makeIdea, makePage, problem } from '@/test/utils';
import { useIdeas } from './useIdeas';

describe('useIdeas', () => {
  it('loads the first page and then the next on demand', async () => {
    const requested: string[] = [];
    server.use(
      http.get('/api/ideas', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requested.push(`${params.get('page')}:${params.get('sort')}`);
        return params.get('page') === '0'
          ? HttpResponse.json(makePage([makeIdea({ id: 1 }), makeIdea({ id: 2 })], { page: 0, totalPages: 2 }))
          : HttpResponse.json(makePage([makeIdea({ id: 3 })], { page: 1, totalPages: 2 }));
      }),
    );

    const { result } = renderHook(() => useIdeas('top'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.ideas.map(i => i.id)).toEqual([1, 2]));
    expect(result.current.hasNextPage).toBe(true);

    await act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.ideas.map(i => i.id)).toEqual([1, 2, 3]));
    expect(result.current.hasNextPage).toBe(false);
    expect(requested).toEqual(['0:top', '1:top']);
  });

  it('skips an idea that a shifted page repeats', async () => {
    server.use(
      http.get('/api/ideas', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        return page === '0'
          ? HttpResponse.json(makePage([makeIdea({ id: 1 })], { page: 0, totalPages: 2 }))
          : HttpResponse.json(makePage([makeIdea({ id: 1 }), makeIdea({ id: 2 })], { page: 1, totalPages: 2 }));
      }),
    );

    const { result } = renderHook(() => useIdeas('newest'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.ideas).toHaveLength(1));
    await act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.ideas.map(i => i.id)).toEqual([1, 2]));
  });

  it('exposes the ApiError when the request fails', async () => {
    server.use(http.get('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));

    const { result } = renderHook(() => useIdeas('newest'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe('INTERNAL_ERROR');
    expect(result.current.ideas).toEqual([]);
  });
});

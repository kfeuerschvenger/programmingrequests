import { act, renderHook, waitFor } from '@testing-library/react';
import type { InfiniteData } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { createTestQueryClient, createWrapper, makeIdea, makePage, problem } from '@/test/utils';
import type { Idea, IdeaPage } from '@/types/ideas';
import { ideasKeys } from './queryKeys';
import { useIdeas } from './useIdeas';
import { nextVote, useVote } from './useVote';

const seed = (ideas: Idea[][]) => {
  const client = createTestQueryClient();
  const data: InfiniteData<IdeaPage, number> = {
    pages: ideas.map((items, index) => makePage(items, { page: index, totalPages: ideas.length })),
    pageParams: ideas.map((_, index) => index),
  };
  client.setQueryData(ideasKeys.list('newest'), data);
  client.setQueryData(ideasKeys.list('top'), data);
  return client;
};

const cached = (client: ReturnType<typeof createTestQueryClient>, sort: 'newest' | 'top' = 'newest') =>
  client.getQueryData<InfiniteData<IdeaPage>>(ideasKeys.list(sort))!.pages.flatMap(page => page.items);

/** A promise that stays pending until `release` is called, to hold a request in flight. */
const deferred = () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>(resolve => (release = resolve));
  return { gate, release };
};

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Votes on one idea whose request is held until released, then fails with the given response. */
const failingVote = async (response: () => Response, id = 1) => {
  const target = makeIdea({ id, score: 3, myVote: 0 });
  const client = seed([[target]]);
  const { gate, release } = deferred();
  server.use(
    http.put(`/api/ideas/${id}/vote`, async () => {
      await gate;
      return response();
    }),
  );
  const hook = renderHook(() => useVote(id), { wrapper: createWrapper({ client }) });
  act(() => hook.result.current.mutate({ idea: target, value: 1 }));

  await waitFor(() => expect(cached(client)[0]).toMatchObject({ score: 4, myVote: 1 }));
  release();
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  return { client, hook };
};

describe('nextVote', () => {
  it('withdraws when the same arrow is pressed and switches otherwise', () => {
    expect(nextVote(makeIdea({ myVote: 1 }), 1)).toBe(0);
    expect(nextVote(makeIdea({ myVote: 1 }), -1)).toBe(-1);
    expect(nextVote(makeIdea({ myVote: 0 }), 1)).toBe(1);
  });
});

describe('useVote', () => {
  beforeEach(() => {
    vi.spyOn(notifications, 'show').mockReturnValue('id');
  });

  it('updates score and myVote in every cached page and sort before the server answers', async () => {
    const target = makeIdea({ id: 2, score: 5, myVote: 0 });
    const client = seed([[makeIdea({ id: 1 })], [target]]);
    const { gate, release } = deferred();
    server.use(
      http.put('/api/ideas/2/vote', async () => {
        await gate;
        return HttpResponse.json({ ...target, score: 6, myVote: 1 });
      }),
    );

    const { result } = renderHook(() => useVote(2), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: 1 }));

    await waitFor(() => expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 }));
    expect(cached(client, 'top')[1]).toMatchObject({ score: 6, myVote: 1 });
    expect(cached(client)[0]).toMatchObject({ id: 1, score: 3 });

    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote sealed' }));
  });

  it('switching a vote moves the score by two', async () => {
    const target = makeIdea({ id: 1, score: 4, myVote: 1 });
    const client = seed([[target]]);
    server.use(http.put('/api/ideas/1/vote', () => HttpResponse.json({ ...target, score: 2, myVote: -1 })));

    const { result } = renderHook(() => useVote(1), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: -1 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cached(client)[0]).toMatchObject({ score: 2, myVote: -1 });
  });

  it('withdraws through DELETE when the active arrow is pressed again', async () => {
    const target = makeIdea({ id: 1, score: 4, myVote: 1 });
    const client = seed([[target]]);
    server.use(http.delete('/api/ideas/1/vote', () => HttpResponse.json({ ...target, score: 3, myVote: 0 })));

    const { result } = renderHook(() => useVote(1), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: 1 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote withdrawn' }));
  });

  it('rolls back and explains a rate limit with the wait time', async () => {
    const { client } = await failingVote(() => problem(429, 'RATE_LIMITED', { retryAfterSeconds: 9 }));

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(cached(client, 'top')[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Easy there, adventurer',
        message: expect.stringContaining('9 seconds') as string,
      }),
    );
  });

  it('rolls back and shows a conflict message on 409', async () => {
    const { client } = await failingVote(() => problem(409, 'CONFLICT'));

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote not saved' }));
  });

  it('recognises a 429 that carries no body by its status and its Retry-After header', async () => {
    const { client } = await failingVote(
      () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '12' } }),
    );

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Easy there, adventurer',
        message: expect.stringContaining('12 seconds') as string,
      }),
    );
  });

  it('recognises a 409 that carries no body by its status', async () => {
    const { client } = await failingVote(() => new HttpResponse(null, { status: 409 }));

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Vote not saved',
        message: expect.stringContaining('Another vote') as string,
      }),
    );
  });

  it('says the vote may not have been saved after a network error, and rolls back', async () => {
    const { client } = await failingVote(() => HttpResponse.error());

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'red', title: 'Vote may not have been saved' }),
    );
  });

  it('uses a neutral title for a server error', async () => {
    await failingVote(() => problem(503, 'UNAVAILABLE'));

    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote not saved' }));
  });

  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
  ])('says voting is not allowed for a %i', async (status, code) => {
    await failingVote(() => problem(status, code));

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Voting not allowed', message: `${code} detail` }),
    );
  });

  it.each([
    [400, 'VALIDATION_FAILED'],
    [404, 'IDEA_NOT_FOUND'],
  ])('uses the neutral title with the server detail for a %i', async (status, code) => {
    await failingVote(() => problem(status, code));

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Vote not saved', message: `${code} detail` }),
    );
  });

  it('says the vote may not have been saved for a response that cannot be read', async () => {
    await failingVote(() => HttpResponse.json({ ok: true }));

    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote may not have been saved' }));
  });

  it('keeps the plain title when the server refused the vote', async () => {
    await failingVote(() => problem(500, 'INTERNAL_ERROR'));

    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vote not saved' }));
  });

  it('invalidates the lists without cancelling a fetch already in flight', async () => {
    const target = makeIdea({ id: 1, score: 3, myVote: 0 });
    const client = seed([[target]]);
    const spy = vi.spyOn(client, 'invalidateQueries');
    server.use(http.put('/api/ideas/1/vote', () => HttpResponse.json({ ...target, score: 4, myVote: 1 })));

    const { result } = renderHook(() => useVote(1), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: 1 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(expect.anything(), { cancelRefetch: false });
  });

  it('explains a rate limit without a wait time', async () => {
    await failingVote(() => problem(429, 'RATE_LIMITED'));

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('in a moment') as string }),
    );
  });

  it('keeps the optimistic vote on another idea when the first vote fails', async () => {
    const first = makeIdea({ id: 1, score: 3, myVote: 0 });
    const second = makeIdea({ id: 2, score: 5, myVote: 0 });
    const client = seed([[first, second]]);
    const firstGate = deferred();
    const secondGate = deferred();
    server.use(
      http.put('/api/ideas/1/vote', async () => {
        await firstGate.gate;
        return problem(500, 'INTERNAL_ERROR');
      }),
      http.put('/api/ideas/2/vote', async () => {
        await secondGate.gate;
        return HttpResponse.json({ ...second, score: 6, myVote: 1 });
      }),
    );

    const { result } = renderHook(() => ({ a: useVote(1), b: useVote(2) }), { wrapper: createWrapper({ client }) });
    act(() => {
      result.current.a.mutate({ idea: first, value: 1 });
      result.current.b.mutate({ idea: second, value: 1 });
    });
    await waitFor(() => {
      expect(cached(client)[0]).toMatchObject({ score: 4, myVote: 1 });
      expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 });
    });

    firstGate.release();
    await waitFor(() => expect(result.current.a.isError).toBe(true));

    expect(cached(client)[0]).toMatchObject({ score: 3, myVote: 0 });
    expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 });

    secondGate.release();
    await waitFor(() => expect(result.current.b.isSuccess).toBe(true));
    expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 });
  });

  it('runs two quick votes on the same idea one after the other', async () => {
    const target = makeIdea({ id: 1, score: 3, myVote: 0 });
    const client = seed([[target]]);
    const firstGate = deferred();
    const requests: unknown[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    server.use(
      http.put('/api/ideas/1/vote', async ({ request }) => {
        requests.push(await request.json());
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        if (requests.length === 1) await firstGate.gate;
        inFlight -= 1;
        return HttpResponse.json({ ...target, score: 2, myVote: -1 });
      }),
    );

    const { result } = renderHook(() => useVote(1), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: 1 }));
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => result.current.mutate({ idea: { ...target, score: 4, myVote: 1 }, value: -1 }));

    await pause(50);
    expect(requests).toEqual([{ value: 1 }]);

    firstGate.release();
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests).toEqual([{ value: 1 }, { value: -1 }]);
    await waitFor(() => expect(cached(client)[0]).toMatchObject({ score: 2, myVote: -1 }));
    expect(maxInFlight).toBe(1);
  });

  it('refetches the lists once the vote settles so the cache agrees with the server', async () => {
    const target = makeIdea({ id: 1, score: 3, myVote: 0 });
    const client = seed([[target]]);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    server.use(http.put('/api/ideas/1/vote', () => HttpResponse.json({ ...target, score: 4, myVote: 1 })));

    const { result } = renderHook(() => useVote(1), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ idea: target, value: 1 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ideasKeys.lists() }, { cancelRefetch: false });
  });

  it('does not refetch while another vote is still in flight', async () => {
    const first = makeIdea({ id: 1, score: 3, myVote: 0 });
    const second = makeIdea({ id: 2, score: 5, myVote: 0 });
    const client = seed([[first, second]]);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const secondGate = deferred();
    server.use(
      http.put('/api/ideas/1/vote', () => HttpResponse.json({ ...first, score: 4, myVote: 1 })),
      http.put('/api/ideas/2/vote', async () => {
        await secondGate.gate;
        return HttpResponse.json({ ...second, score: 6, myVote: 1 });
      }),
    );

    const { result } = renderHook(() => ({ a: useVote(1), b: useVote(2) }), { wrapper: createWrapper({ client }) });
    act(() => {
      result.current.a.mutate({ idea: first, value: 1 });
      result.current.b.mutate({ idea: second, value: 1 });
    });
    await waitFor(() => expect(result.current.a.isSuccess).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();

    secondGate.release();
    await waitFor(() => expect(result.current.b.isSuccess).toBe(true));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  });

  it('keeps a vote started during the refetch of an earlier vote from being reverted by its answer', async () => {
    const first = makeIdea({ id: 1, score: 3, myVote: 0 });
    const second = makeIdea({ id: 2, score: 5, myVote: 0 });
    const secondGate = deferred();
    const refetchGate = deferred();
    let listCalls = 0;
    server.use(
      http.get('/api/ideas', async () => {
        listCalls += 1;
        if (listCalls === 2) {
          await refetchGate.gate;
          // The answer to the reconciliation refetch started by the first vote: it predates the second vote.
          return HttpResponse.json(makePage([{ ...first, score: 4, myVote: 1 }, second]));
        }
        if (listCalls === 1) return HttpResponse.json(makePage([first, second]));
        return HttpResponse.json(
          makePage([
            { ...first, score: 4, myVote: 1 },
            { ...second, score: 6, myVote: 1 },
          ]),
        );
      }),
      http.put('/api/ideas/1/vote', () => HttpResponse.json({ ...first, score: 4, myVote: 1 })),
      http.put('/api/ideas/2/vote', async () => {
        await secondGate.gate;
        return HttpResponse.json({ ...second, score: 6, myVote: 1 });
      }),
    );

    const client = createTestQueryClient();
    const { result } = renderHook(() => ({ list: useIdeas('newest'), a: useVote(1), b: useVote(2) }), {
      wrapper: createWrapper({ client }),
    });
    await waitFor(() => expect(result.current.list.ideas).toHaveLength(2));

    act(() => result.current.a.mutate({ idea: first, value: 1 }));
    await waitFor(() => expect(listCalls).toBe(2));

    act(() => result.current.b.mutate({ idea: second, value: 1 }));
    await waitFor(() => expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 }));

    refetchGate.release();
    await pause(50);
    expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 });
    expect(cached(client)[0]).toMatchObject({ score: 4, myVote: 1 });

    secondGate.release();
    await waitFor(() => expect(result.current.b.isSuccess).toBe(true));
    await waitFor(() => expect(listCalls).toBe(3));
    await waitFor(() => expect(result.current.list.isFetching).toBe(false));
    expect(cached(client)[1]).toMatchObject({ score: 6, myVote: 1 });
  });
});

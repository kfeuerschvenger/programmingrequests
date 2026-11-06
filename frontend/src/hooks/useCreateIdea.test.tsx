import { act, renderHook, waitFor } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { createTestQueryClient, createWrapper, makeIdea, problem } from '@/test/utils';
import { ideasKeys } from './queryKeys';
import { useCreateIdea } from './useCreateIdea';

describe('useCreateIdea', () => {
  beforeEach(() => {
    vi.spyOn(notifications, 'show').mockReturnValue('id');
  });

  it('invalidates every cached list after a successful create', async () => {
    const client = createTestQueryClient();
    client.setQueryData(ideasKeys.list('newest'), { pages: [], pageParams: [] });
    server.use(http.post('/api/ideas', () => HttpResponse.json(makeIdea(), { status: 201 })));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(ideasKeys.list('newest'))?.isInvalidated).toBe(true);
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Quest posted' }));
  });

  it('leaves field errors to the form', async () => {
    server.use(
      http.post('/api/ideas', () =>
        problem(400, 'VALIDATION_FAILED', { errors: [{ field: 'description', message: 'Too short' }] }),
      ),
    );

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper() });
    act(() => result.current.mutate({ description: 'short' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.fieldErrors).toHaveLength(1);
    expect(notifications.show).not.toHaveBeenCalled();
  });

  it('notifies a rate limit with the wait time', async () => {
    server.use(http.post('/api/ideas', () => problem(429, 'RATE_LIMITED', { retryAfterSeconds: 30 })));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper() });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Easy there, adventurer',
        message: expect.stringContaining('30 seconds') as string,
      }),
    );
  });

  it('refreshes the lists and warns that the idea may exist when the answer cannot be read', async () => {
    const client = createTestQueryClient();
    client.setQueryData(ideasKeys.list('newest'), { pages: [], pageParams: [] });
    server.use(http.post('/api/ideas', () => HttpResponse.json({ ok: true }, { status: 201 })));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryState(ideasKeys.list('newest'))?.isInvalidated).toBe(true);
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quest may have been posted',
        message: expect.stringContaining('Check the board before posting it again') as string,
      }),
    );
  });

  it('warns that the quest may be on the board after a network failure', async () => {
    server.use(http.post('/api/ideas', () => HttpResponse.error()));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper() });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quest may have been posted',
        message: expect.stringContaining('check it before posting again') as string,
      }),
    );
  });

  it('refreshes the lists after a rejected create too', async () => {
    const client = createTestQueryClient();
    client.setQueryData(ideasKeys.list('newest'), { pages: [], pageParams: [] });
    server.use(http.post('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper({ client }) });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryState(ideasKeys.list('newest'))?.isInvalidated).toBe(true);
  });

  it('notifies a conflict', async () => {
    server.use(http.post('/api/ideas', () => new HttpResponse(null, { status: 409 })));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper() });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Another request') as string }),
    );
  });

  it('notifies any other failure with the server message', async () => {
    server.use(http.post('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));

    const { result } = renderHook(() => useCreateIdea(), { wrapper: createWrapper() });
    act(() => result.current.mutate({ description: 'A long enough description' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Quest not posted', message: 'INTERNAL_ERROR detail' }),
    );
  });
});

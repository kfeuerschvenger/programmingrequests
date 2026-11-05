import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { makeIdea, makePage, problem } from '@/test/utils';
import { castVote, createIdea, listIdeas, withdrawVote } from './ideas.service';
import { ApiError } from './http/apiError';

describe('ideas service', () => {
  it('lists ideas with page, size and sort', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get('/api/ideas', ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(makePage([makeIdea()]));
      }),
    );

    const page = await listIdeas({ page: 2, size: 20, sort: 'top' });

    expect(query?.get('page')).toBe('2');
    expect(query?.get('size')).toBe('20');
    expect(query?.get('sort')).toBe('top');
    expect(page.items).toHaveLength(1);
  });

  it('rejects a list response that is not a page', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.html('<html>login</html>')));

    await expect(listIdeas({ page: 0, size: 20, sort: 'newest' })).rejects.toMatchObject({
      constructor: ApiError,
      kind: 'invalid_response',
    });
  });

  it('rejects a page whose ideas have the wrong shape', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json({ ...makePage([]), items: [{ id: 'x' }] })));

    await expect(listIdeas({ page: 0, size: 20, sort: 'newest' })).rejects.toMatchObject({ kind: 'invalid_response' });
  });

  it('rejects a vote response that is not an idea', async () => {
    server.use(http.put('/api/ideas/1/vote', () => HttpResponse.json({ ok: true })));

    await expect(castVote(1, 1)).rejects.toMatchObject({ kind: 'invalid_response' });
  });

  it('rejects a created idea that is not an idea', async () => {
    server.use(http.post('/api/ideas', () => HttpResponse.json([], { status: 201 })));

    await expect(createIdea({ description: 'A long enough description' })).rejects.toMatchObject({
      kind: 'invalid_response',
    });
  });

  it('creates an idea', async () => {
    let body: unknown;
    server.use(
      http.post('/api/ideas', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeIdea(), { status: 201 });
      }),
    );

    await createIdea({ description: 'A long enough description' });

    expect(body).toEqual({ description: 'A long enough description' });
  });

  it('casts a vote', async () => {
    let body: unknown;
    server.use(
      http.put('/api/ideas/1/vote', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeIdea({ myVote: -1 }));
      }),
    );

    const idea = await castVote(1, -1);

    expect(body).toEqual({ value: -1 });
    expect(idea.myVote).toBe(-1);
  });

  it('withdraws a vote', async () => {
    server.use(http.delete('/api/ideas/1/vote', () => HttpResponse.json(makeIdea({ myVote: 0 }))));
    expect((await withdrawVote(1)).myVote).toBe(0);
  });

  it('rejects with an ApiError on a problem response', async () => {
    server.use(http.get('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));

    await expect(listIdeas({ page: 0, size: 20, sort: 'newest' })).rejects.toMatchObject({
      constructor: ApiError,
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });
});

import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { makeIdea, makePage, problem, renderWithProviders } from '@/test/utils';
import IdeasList from './IdeasList';

describe('IdeasList', () => {
  it('shows the skeleton while loading and then the ideas', async () => {
    server.use(
      http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea({ description: 'First idea text' })]))),
    );
    renderWithProviders(<IdeasList />);

    expect(screen.getByTestId('idea-list-skeleton')).toBeInTheDocument();
    expect(await screen.findByText('First idea text')).toBeInTheDocument();
    expect(screen.queryByTestId('idea-list-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([]))));
    renderWithProviders(<IdeasList />);

    expect(await screen.findByText('No previous ideas where found')).toBeInTheDocument();
  });

  it('shows a status error with a retry that recovers', async () => {
    const user = userEvent.setup();
    let fail = true;
    server.use(
      http.get('/api/ideas', () =>
        fail
          ? problem(400, 'VALIDATION_FAILED')
          : HttpResponse.json(makePage([makeIdea({ description: 'Recovered idea' })])),
      ),
    );
    renderWithProviders(<IdeasList />);

    const status = (await screen.findByText('VALIDATION_FAILED detail')).closest<HTMLElement>('[role="status"]')!;
    expect(status).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fail = false;
    await user.click(within(status).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Recovered idea')).toBeInTheDocument();
  });

  it('loads more ideas on demand', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/ideas', ({ request }) =>
        new URL(request.url).searchParams.get('page') === '0'
          ? HttpResponse.json(
              makePage([makeIdea({ id: 1, description: 'Idea on page one' })], { page: 0, totalPages: 2 }),
            )
          : HttpResponse.json(
              makePage([makeIdea({ id: 2, description: 'Idea on page two' })], { page: 1, totalPages: 2 }),
            ),
      ),
    );
    renderWithProviders(<IdeasList />);

    await screen.findByText('Idea on page one');
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Idea on page two')).toBeInTheDocument();
    expect(screen.getByText('Idea on page one')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('keeps the loaded ideas and offers a retry when the next page fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/ideas', ({ request }) =>
        new URL(request.url).searchParams.get('page') === '0'
          ? HttpResponse.json(
              makePage([makeIdea({ id: 1, description: 'Idea on page one' })], { page: 0, totalPages: 2 }),
            )
          : problem(400, 'VALIDATION_FAILED'),
      ),
    );
    renderWithProviders(<IdeasList />);

    await screen.findByText('Idea on page one');
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('VALIDATION_FAILED detail')).toBeInTheDocument();
    expect(screen.getByText('Idea on page one')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('retries only the next page when that is what failed', async () => {
    const user = userEvent.setup();
    const pages: (string | null)[] = [];
    let failNext = true;
    server.use(
      http.get('/api/ideas', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        pages.push(page);
        if (page === '0') {
          return HttpResponse.json(
            makePage([makeIdea({ id: 1, description: 'Idea on page one' })], { page: 0, totalPages: 2 }),
          );
        }
        return failNext
          ? problem(400, 'VALIDATION_FAILED')
          : HttpResponse.json(
              makePage([makeIdea({ id: 2, description: 'Idea on page two' })], { page: 1, totalPages: 2 }),
            );
      }),
    );
    renderWithProviders(<IdeasList />);

    await screen.findByText('Idea on page one');
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('VALIDATION_FAILED detail');

    failNext = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Idea on page two')).toBeInTheDocument();
    expect(pages).toEqual(['0', '1', '1']);
  });

  it('refetches the list, without Load more, when a background refetch fails', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.get('/api/ideas', () => {
        calls += 1;
        return calls === 2
          ? problem(400, 'VALIDATION_FAILED')
          : HttpResponse.json(
              makePage([makeIdea({ id: 1, description: 'Idea on page one' })], { page: 0, totalPages: 2 }),
            );
      }),
    );
    const { client } = renderWithProviders(<IdeasList />);

    await screen.findByText('Idea on page one');
    await act(() => client.invalidateQueries());
    await screen.findByText('VALIDATION_FAILED detail');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(screen.queryByText('VALIDATION_FAILED detail')).not.toBeInTheDocument());
    expect(calls).toBe(3);
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
  });

  it('keeps the current ideas on screen while a new sort loads', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/ideas', async ({ request }) => {
        if (new URL(request.url).searchParams.get('sort') === 'oldest') {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(makePage([makeIdea({ id: 2, description: 'Oldest idea' })]));
        }
        return HttpResponse.json(makePage([makeIdea({ id: 1, description: 'Newest idea' })]));
      }),
    );
    renderWithProviders(<IdeasList />);

    await screen.findByText('Newest idea');
    await user.click(screen.getByText('Oldest'));

    expect(screen.queryByTestId('idea-list-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('Newest idea')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Ideas' })).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByText('Oldest idea')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Ideas' })).toHaveAttribute('aria-busy', 'false');
  });

  it('is not busy once the first load has finished', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea()]))));
    renderWithProviders(<IdeasList />);

    await screen.findByText(makeIdea().description);
    expect(screen.getByRole('region', { name: 'Ideas' })).toHaveAttribute('aria-busy', 'false');
  });

  it('keeps the arrows disabled for an idea whose vote is in flight after the item remounts', async () => {
    const user = userEvent.setup();
    const idea = makeIdea({ id: 5, score: 3, myVote: 0 });
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => (release = resolve));
    const votes: unknown[] = [];
    server.use(
      http.get('/api/ideas', () => HttpResponse.json(makePage([idea]))),
      http.put('/api/ideas/5/vote', async ({ request }) => {
        votes.push(await request.json());
        await gate;
        return HttpResponse.json({ ...idea, score: 4, myVote: 1 });
      }),
    );
    const { client, rerender } = renderWithProviders(<IdeasList key="first" />);

    await screen.findByText(idea.description);
    await user.click(screen.getByRole('button', { name: 'Vote up' }));
    await waitFor(() => expect(votes).toHaveLength(1));

    // A different key remounts the whole list, and with it every item and its hook instance.
    rerender(<IdeasList key="second" />);
    const arrow = await screen.findByRole('button', { name: 'Vote up' });
    expect(client.isMutating()).toBe(1);
    expect(arrow).toHaveAttribute('aria-disabled', 'true');

    await user.click(arrow);
    release();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Vote up' })).toHaveAttribute('aria-disabled', 'false'),
    );
    expect(votes).toHaveLength(1);
  });

  it('requests the sort from the URL and changes it with the control', async () => {
    const user = userEvent.setup();
    const sorts: (string | null)[] = [];
    server.use(
      http.get('/api/ideas', ({ request }) => {
        sorts.push(new URL(request.url).searchParams.get('sort'));
        return HttpResponse.json(makePage([makeIdea()]));
      }),
    );
    renderWithProviders(<IdeasList />, { route: '/?sort=top' });

    await waitFor(() => expect(sorts).toEqual(['top']));
    await user.click(screen.getByText('Oldest'));

    await waitFor(() => expect(sorts).toEqual(['top', 'oldest']));
  });

  it('votes optimistically from the list', async () => {
    const user = userEvent.setup();
    const idea = makeIdea({ id: 5, score: 3, myVote: 0 });
    // The list refetches after the vote settles, so the server state has to move with the vote.
    let stored = idea;
    server.use(
      http.get('/api/ideas', () => HttpResponse.json(makePage([stored]))),
      http.put('/api/ideas/5/vote', () => {
        stored = { ...idea, score: 4, myVote: 1 };
        return HttpResponse.json(stored);
      }),
    );
    renderWithProviders(<IdeasList />, { withNotifications: true });

    await screen.findByText(idea.description);
    await user.click(screen.getByRole('button', { name: 'Vote up' }));

    await waitFor(() => expect(screen.getByTestId('score')).toHaveTextContent('4'));
    expect(screen.getByTestId('score')).toHaveTextContent('Score: 4');
    expect(screen.getByTestId('score')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: 'Vote up' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Vote submitted!')).toBeInTheDocument();
  });

  it('shows Anonymous for an idea without an author', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea({ author: null })]))));
    renderWithProviders(<IdeasList />);

    expect(await screen.findByText('Anonymous')).toBeInTheDocument();
  });
});

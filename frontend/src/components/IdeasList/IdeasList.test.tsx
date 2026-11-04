import { screen, waitFor, within } from '@testing-library/react';
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

  it('shows an alert with a retry that recovers', async () => {
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

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('VALIDATION_FAILED detail')).toBeInTheDocument();

    fail = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

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

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Idea on page one')).toBeInTheDocument();
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
    server.use(
      http.get('/api/ideas', () => HttpResponse.json(makePage([idea]))),
      http.put('/api/ideas/5/vote', () => HttpResponse.json({ ...idea, score: 4, myVote: 1 })),
    );
    renderWithProviders(<IdeasList />, { withNotifications: true });

    await screen.findByText(idea.description);
    await user.click(screen.getByRole('button', { name: 'Vote up' }));

    await waitFor(() => expect(screen.getByTestId('score')).toHaveTextContent('4'));
    expect(screen.getByRole('button', { name: 'Vote up' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Vote submitted!')).toBeInTheDocument();
  });

  it('shows Anonymous for an idea without an author', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea({ author: null })]))));
    renderWithProviders(<IdeasList />);

    expect(await screen.findByText('Anonymous')).toBeInTheDocument();
  });
});

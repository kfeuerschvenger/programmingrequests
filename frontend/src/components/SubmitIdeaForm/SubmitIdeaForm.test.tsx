import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { makeIdea, problem, renderWithProviders } from '@/test/utils';
import { ideaSchema } from './ideaSchema';
import { SubmitIdeaForm } from './SubmitIdeaForm';

const VALID = 'A long enough idea for the board';

describe('ideaSchema', () => {
  it('matches the API limits', () => {
    expect(ideaSchema.safeParse({ author: '', description: '123456789' }).success).toBe(false);
    expect(ideaSchema.safeParse({ author: '', description: '1234567890' }).success).toBe(true);
    expect(ideaSchema.safeParse({ author: '', description: 'x'.repeat(1001) }).success).toBe(false);
    expect(ideaSchema.safeParse({ author: 'a'.repeat(61), description: VALID }).success).toBe(false);
    expect(ideaSchema.safeParse({ author: 'a'.repeat(60), description: VALID }).success).toBe(true);
  });
});

describe('SubmitIdeaForm', () => {
  it('blocks a short description on the client without calling the API', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post('/api/ideas', () => {
        called = true;
        return HttpResponse.json(makeIdea(), { status: 201 });
      }),
    );
    renderWithProviders(<SubmitIdeaForm />);

    await user.type(screen.getByLabelText('The quest'), 'short');
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText(/10 characters at least/)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('blocks an author that is too long', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubmitIdeaForm />);

    // Pasting is one event; typing 61 characters one by one is slow enough to hit the test timeout on a busy machine.
    await user.click(screen.getByLabelText('Your name'));
    await user.paste('a'.repeat(61));
    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText(/60 characters at most/)).toBeInTheDocument();
  });

  it('keeps the inputs focusable and read-only while the request is pending', async () => {
    const user = userEvent.setup();
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => (release = resolve));
    server.use(
      http.post('/api/ideas', async () => {
        await gate;
        return HttpResponse.json(makeIdea(), { status: 201 });
      }),
    );
    const { container } = renderWithProviders(<SubmitIdeaForm />);

    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    await waitFor(() => expect(screen.getByLabelText('The quest')).toHaveAttribute('readonly'));
    expect(screen.getByLabelText('The quest')).not.toBeDisabled();
    expect(screen.getByLabelText('Your name')).toHaveAttribute('readonly');
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true');

    release();
    await waitFor(() => expect(screen.getByLabelText('The quest')).not.toHaveAttribute('readonly'));
    expect(screen.getByLabelText('The quest')).toHaveValue('');
  });

  it('submits trimmed values, omits an empty author and clears the form', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/ideas', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeIdea(), { status: 201 });
      }),
    );
    renderWithProviders(<SubmitIdeaForm />, { withNotifications: true });

    await user.type(screen.getByLabelText('The quest'), `  ${VALID}  `);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    await waitFor(() => expect(body).toEqual({ description: VALID }));
    await waitFor(() => expect(screen.getByLabelText('The quest')).toHaveValue(''));
    expect(await screen.findByText('Quest posted')).toBeInTheDocument();
  });

  it('sends the author when one is given', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/ideas', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeIdea(), { status: 201 });
      }),
    );
    renderWithProviders(<SubmitIdeaForm />);

    await user.type(screen.getByLabelText('Your name'), 'Ada');
    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    await waitFor(() => expect(body).toEqual({ author: 'Ada', description: VALID }));
  });

  it('shows server field errors next to their inputs and keeps the typed values', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/ideas', () =>
        problem(400, 'VALIDATION_FAILED', {
          errors: [
            { field: 'description', message: 'The description is not acceptable.' },
            { field: 'author', message: 'The author is not acceptable.' },
            { field: 'request', message: 'ignored here' },
          ],
        }),
      ),
    );
    renderWithProviders(<SubmitIdeaForm />);

    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText('The description is not acceptable.')).toBeInTheDocument();
    expect(screen.getByText('The author is not acceptable.')).toBeInTheDocument();
    expect(screen.getByLabelText('The quest')).toHaveValue(VALID);
  });

  it('notifies a field error that maps to no input', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/ideas', () =>
        problem(400, 'VALIDATION_FAILED', {
          errors: [
            { field: 'description', message: 'The description is not acceptable.' },
            { field: 'request', message: 'The request is malformed.' },
          ],
        }),
      ),
    );
    renderWithProviders(<SubmitIdeaForm />, { withNotifications: true });

    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText('The description is not acceptable.')).toBeInTheDocument();
    expect(await screen.findByText('The request is malformed.')).toBeInTheDocument();
    expect(screen.getByText('Quest not posted')).toBeInTheDocument();
  });

  it('notifies a failure that has no field errors', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));
    renderWithProviders(<SubmitIdeaForm />, { withNotifications: true });

    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText('Quest not posted')).toBeInTheDocument();
  });

  it('tells the user a quest may already be on the board when the network fails after the post', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/ideas', () => HttpResponse.error()));
    renderWithProviders(<SubmitIdeaForm />, { withNotifications: true });

    await user.type(screen.getByLabelText('The quest'), VALID);
    await user.click(screen.getByRole('button', { name: 'Post the quest' }));

    expect(await screen.findByText('Quest may have been posted')).toBeInTheDocument();
    expect(screen.getByText(/check it before posting again/)).toBeInTheDocument();
    expect(screen.getByLabelText('The quest')).toHaveValue(VALID);
  });

  it('shows the quest as the sheet heading and counts the characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubmitIdeaForm />);

    expect(screen.getByRole('heading', { level: 2, name: 'Post a quest' })).toBeInTheDocument();
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
    await user.type(screen.getByLabelText('The quest'), 'Twelve chars');
    expect(screen.getByText('12 / 1000')).toBeInTheDocument();
  });

  it('describes the optional name as anonymous when left blank', () => {
    renderWithProviders(<SubmitIdeaForm />);

    expect(screen.getByText(/Anonymous adventurer/)).toBeInTheDocument();
  });
});

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

    await user.type(screen.getByLabelText('Description'), 'short');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(/10 characters at least/)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('blocks an author that is too long', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubmitIdeaForm />);

    await user.type(screen.getByLabelText('Author'), 'a'.repeat(61));
    await user.type(screen.getByLabelText('Description'), VALID);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(/60 characters at most/)).toBeInTheDocument();
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

    await user.type(screen.getByLabelText('Description'), `  ${VALID}  `);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(body).toEqual({ description: VALID }));
    await waitFor(() => expect(screen.getByLabelText('Description')).toHaveValue(''));
    expect(await screen.findByText('Idea submitted!')).toBeInTheDocument();
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

    await user.type(screen.getByLabelText('Author'), 'Ada');
    await user.type(screen.getByLabelText('Description'), VALID);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

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

    await user.type(screen.getByLabelText('Description'), VALID);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('The description is not acceptable.')).toBeInTheDocument();
    expect(screen.getByText('The author is not acceptable.')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue(VALID);
  });

  it('notifies a failure that has no field errors', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/ideas', () => problem(500, 'INTERNAL_ERROR')));
    renderWithProviders(<SubmitIdeaForm />, { withNotifications: true });

    await user.type(screen.getByLabelText('Description'), VALID);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Idea not submitted')).toBeInTheDocument();
  });
});

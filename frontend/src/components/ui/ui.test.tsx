import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';
import { EmptyState, ErrorBoundary, ErrorState, IdeaListSkeleton } from '.';

const renderUi = (ui: ReactNode) => render(<MantineProvider>{ui}</MantineProvider>);

const Boom = ({ explode }: { explode: boolean }) => {
  if (explode) throw new Error('render failure');
  return <p>all good</p>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders its children when nothing fails', () => {
    renderUi(
      <ErrorBoundary>
        <Boom explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('shows an alert with a reload action and logs the error when a child throws', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const user = userEvent.setup();

    renderUi(
      <ErrorBoundary>
        <Boom explode />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('The tavern is on fire');
    expect(console.error).toHaveBeenCalledWith('Unhandled render error', expect.any(Error), expect.any(String));
    await user.click(screen.getByRole('button', { name: 'Reload page' }));
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('ErrorState', () => {
  it('is a status with the message and no button without a retry handler', () => {
    renderUi(<ErrorState message="Nope" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nope');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is an alert when asked to be', () => {
    renderUi(<ErrorState message="Nope" role="alert" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Nope');
  });

  it('calls the retry handler', async () => {
    const onRetry = vi.fn();
    renderUi(<ErrorState message="Nope" onRetry={onRetry} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('shows its message', () => {
    renderUi(<EmptyState message="Nothing here" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing here');
  });
});

describe('IdeaListSkeleton', () => {
  it('is a busy status region', () => {
    renderUi(<IdeaListSkeleton count={2} />);
    expect(screen.getByRole('status', { name: 'Unrolling the scrolls' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

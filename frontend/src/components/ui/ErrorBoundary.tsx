import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import classes from './States.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Last line of defence: a render error anywhere below shows a recoverable message instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className={classes.boundary}>
        <ErrorState
          role="alert"
          title="The tavern is on fire"
          message="An unexpected error stopped the board from loading. Reloading the page usually puts the fire out."
          retryLabel="Reload page"
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }
}

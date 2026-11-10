import { Button } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { Parchment } from '@/components/Parchment/Parchment';
import classes from './States.module.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** `alert` interrupts the screen reader and is for the last-resort fallback; `status` announces politely. */
  role?: 'alert' | 'status';
}

export function ErrorState({
  title = 'The board creaked and something broke',
  message,
  retryLabel = 'Try again',
  onRetry,
  retrying,
  role = 'status',
}: ErrorStateProps) {
  return (
    <Parchment kind="sheet" seed={5} pinned leans={false} role={role} className={classes.state}>
      <div className={classes.centered}>
        <IconFlame size={44} stroke={1.5} aria-hidden="true" className={classes.alertIcon} />
        <h3 className={classes.title}>{title}</h3>
        <p className={classes.message}>{message}</p>
        {onRetry && (
          <Button color="wax" loading={retrying} onClick={onRetry} mt="xs">
            {retryLabel}
          </Button>
        )}
      </div>
    </Parchment>
  );
}

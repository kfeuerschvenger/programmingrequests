import { IconNotes } from '@tabler/icons-react';
import { Parchment } from '@/components/Parchment/Parchment';
import classes from './States.module.css';

interface EmptyStateProps {
  title?: string;
  message: string;
}

export function EmptyState({ title = 'The board is bare', message }: EmptyStateProps) {
  return (
    <Parchment kind="sheet" seed={3} pinned leans={false} role="status" className={classes.state}>
      <div className={classes.centered}>
        <IconNotes size={44} stroke={1.5} aria-hidden="true" className={classes.icon} />
        <h3 className={classes.title}>{title}</h3>
        <p className={classes.message}>{message}</p>
      </div>
    </Parchment>
  );
}

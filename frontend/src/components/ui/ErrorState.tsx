import { Alert, Button, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({
  title = 'UPS! There was an error',
  message,
  retryLabel = 'Try again',
  onRetry,
  retrying,
}: ErrorStateProps) {
  return (
    <Alert role="alert" color="red" variant="light" title={title} icon={<IconAlertCircle />}>
      <Stack gap="sm" align="flex-start">
        {message}
        {onRetry && (
          <Button variant="light" color="red" size="xs" loading={retrying} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

import { Text } from '@mantine/core';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Text role="status" c="dimmed" ta="center" py="xl">
      {message}
    </Text>
  );
}

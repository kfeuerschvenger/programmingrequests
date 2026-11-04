import { Group, Paper, Skeleton, Stack } from '@mantine/core';

interface IdeaListSkeletonProps {
  count?: number;
}

export function IdeaListSkeleton({ count = 3 }: IdeaListSkeletonProps) {
  return (
    <Stack aria-busy="true" aria-label="Loading ideas" role="status" data-testid="idea-list-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <Paper key={index} withBorder radius="md" p="lg">
          <Group>
            <Skeleton circle height={38} />
            <Stack gap={6}>
              <Skeleton height={10} width={120} />
              <Skeleton height={8} width={70} />
            </Stack>
          </Group>
          <Skeleton height={10} mt="md" />
          <Skeleton height={10} mt={6} width="80%" />
        </Paper>
      ))}
    </Stack>
  );
}

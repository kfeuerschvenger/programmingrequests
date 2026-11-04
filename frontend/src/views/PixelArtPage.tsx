import { Box, Center, Text, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

import { BlurImage } from '@/components';

export function PixelArtPage() {
  return (
    <Center h="100vh" bg="var(--mantine-color-body)">
      <Box ta="center">
        <Box mb="md" pos="relative" h={200}>
          <BlurImage src="wip.png" lowResSrc="wip-sm.png" alt="Work in progress" width={200} />
        </Box>
        <Title order={2} mb="xs">
          Work in Progress
        </Title>
        <Text c="dimmed" mb="lg">
          I'm crafting something cool here. This section isn't ready yet, but it's on the way!
        </Text>
        <Button component={Link} to="/">
          Back to Home
        </Button>
      </Box>
    </Center>
  );
}

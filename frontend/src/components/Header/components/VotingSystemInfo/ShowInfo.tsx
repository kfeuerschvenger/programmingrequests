import { modals } from '@mantine/modals';
import { Button, Flex, Space, Text } from '@mantine/core';

export function showInfo() {
  modals.open({
    title: 'Voting System',
    overlayProps: {
      backgroundOpacity: 0.3,
      blur: 3,
    },
    children: (
      <>
        <Text size="sm">
          In this realm of choices, you wield the power of a single vote, for or against. Should doubt cloud your mind,
          fear not: by striking with the opposite vote, you erase your past decision and regain the right to cast your
          will once more!
        </Text>
        <Space h="md" />
        <Flex justify="flex-end">
          <Button onClick={() => modals.closeAll()} mt="md">
            I accept my destiny
          </Button>
        </Flex>
      </>
    ),
  });
}

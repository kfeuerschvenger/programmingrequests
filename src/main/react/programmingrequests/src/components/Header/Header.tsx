import classes from './Header.module.css';

import {
  ActionIcon,
  Box,
  Burger,
  Divider,
  Drawer,
  Group,
  ScrollArea,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';

import { useDisclosure } from '@mantine/hooks';
import { IconHelp, IconMoon, IconSun } from '@tabler/icons-react';

import { Logo } from '@/components';
import { showInfo, NavigationLinks } from './components';

export function Header() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const ThemeToggle = (
    <Tooltip label="Toggle theme">
      <ActionIcon onClick={toggleColorScheme} variant="default" size="xl" aria-label="Toggle color scheme">
        <IconSun display={computedColorScheme === 'light' ? 'none' : 'block'} className="icon" stroke={1.5} />
        <IconMoon display={computedColorScheme === 'dark' ? 'none' : 'block'} className="icon" stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );

  const InfoButton = (
    <Tooltip label="Shows info about how the voting system works">
      <ActionIcon onClick={showInfo} variant="default" size="xl" aria-label="Voting system info">
        <IconHelp className="icon" stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );

  return (
    <Box pb={60}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <Logo variant="header" />

          <Group h="100%" gap={0} visibleFrom="sm">
            <NavigationLinks className={classes.link} />
          </Group>

          <Group visibleFrom="sm">
            {InfoButton}
            {ThemeToggle}
          </Group>

          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />
          <NavigationLinks onClick={closeDrawer} />
          <Divider my="sm" />
          <Group justify="center" grow pb="xl" px="md">
            {InfoButton}
            {ThemeToggle}
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}

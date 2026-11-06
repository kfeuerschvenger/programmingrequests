import classes from './Header.module.css';

import { Tooltip, UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconHelp, IconMoon, IconSun } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { Logo } from '@/components/Logo/Logo';
import { showInfo } from './components';

export function Header() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const nextScheme = scheme === 'light' ? 'dark' : 'light';
  const themeLabel = `Switch to ${nextScheme} mode`;

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Link to="/" className={classes.brand}>
          <Logo variant="header" decorative />
          <span className={classes.name}>Code Quests</span>
        </Link>

        <div className={classes.tools}>
          <Tooltip label="How voting works">
            <UnstyledButton className={classes.tool} onClick={showInfo} aria-label="Voting rules">
              <IconHelp size={22} stroke={1.75} aria-hidden="true" />
              <span className={classes.toolText}>Voting rules</span>
            </UnstyledButton>
          </Tooltip>
          <Tooltip label={themeLabel}>
            <UnstyledButton className={classes.tool} onClick={() => setColorScheme(nextScheme)} aria-label={themeLabel}>
              {scheme === 'light' ? (
                <IconMoon size={22} stroke={1.75} aria-hidden="true" />
              ) : (
                <IconSun size={22} stroke={1.75} aria-hidden="true" />
              )}
            </UnstyledButton>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

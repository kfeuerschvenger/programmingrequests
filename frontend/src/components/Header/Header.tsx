import classes from './Header.module.css';

import { Tooltip, UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconHelp, IconMoon, IconSun } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { art } from '@/components/Scene/assets';
import { showInfo } from './components';

/** The title sign hangs from two chains, a coil of rope hangs beside it, and the two small controls sit apart from the sign, on the planks. */
export function Header() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const nextScheme = scheme === 'light' ? 'dark' : 'light';
  const themeLabel = `Switch to ${nextScheme} mode`;

  return (
    <header className={classes.header}>
      <div className={classes.hang}>
        <span className={`${classes.chain} ${classes.chainLeft}`} aria-hidden="true" />
        <span className={`${classes.chain} ${classes.chainRight}`} aria-hidden="true" />
        <img
          className={classes.rope}
          src={art.rope.src}
          srcSet={art.rope.srcSet}
          width={art.rope.width}
          height={art.rope.height}
          alt=""
          aria-hidden="true"
        />
        <div className={classes.sign}>
          <h1 className={classes.title}>
            <Link to="/" className={classes.brand}>
              Code Quests
            </Link>
          </h1>
        </div>
      </div>

      <p className={classes.tagline}>
        <span className={classes.line}>Post a quest.</span>
        <span className={classes.line}>Let the hero code.</span>
      </p>

      <div className={classes.tools}>
        <Tooltip label="How voting works">
          <UnstyledButton className={classes.tool} onClick={showInfo} aria-label="Voting rules">
            <IconHelp size={20} stroke={1.75} aria-hidden="true" />
            <span className={classes.toolText}>Voting rules</span>
          </UnstyledButton>
        </Tooltip>
        <Tooltip label={themeLabel}>
          <UnstyledButton className={classes.tool} onClick={() => setColorScheme(nextScheme)} aria-label={themeLabel}>
            {scheme === 'light' ? (
              <IconMoon size={20} stroke={1.75} aria-hidden="true" />
            ) : (
              <IconSun size={20} stroke={1.75} aria-hidden="true" />
            )}
          </UnstyledButton>
        </Tooltip>
      </div>
    </header>
  );
}

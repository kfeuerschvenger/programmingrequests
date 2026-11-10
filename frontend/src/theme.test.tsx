import { MantineProvider } from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('gives the close button of every notification a name for screen readers', async () => {
    render(
      <MantineProvider theme={theme}>
        <Notifications />
      </MantineProvider>,
    );

    act(() => {
      notifications.show({ title: 'Vote sealed', message: 'Your vote is on the board.' });
    });

    expect(await screen.findByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });

  it('uses the wood and brass plates for buttons', () => {
    expect(theme.components?.Button).toBeDefined();
    expect(theme.primaryColor).toBe('brass');
  });
});

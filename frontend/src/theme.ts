import { createTheme } from '@mantine/core';

// Keeps the look of the previous major: Mantine 9 raised the default radius and the medium font weight.
export const theme = createTheme({
  defaultRadius: 'sm',
  fontWeights: { medium: '500' },
});

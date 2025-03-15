import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core';
import App from './App.tsx'

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
)

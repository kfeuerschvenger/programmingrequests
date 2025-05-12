import '@mantine/notifications/styles.css';

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

import App from './App.tsx';
import { GlobalProvider } from '@/context';

const root = createRoot(document.getElementById('root') as HTMLElement);

const useStrictMode = import.meta.env.VITE_USE_STRICT_MODE === 'true';

const app = (
  <GlobalProvider>
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" limit={5} />
      <ModalsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </GlobalProvider>
);

root.render(useStrictMode ? <StrictMode>{app}</StrictMode> : app);

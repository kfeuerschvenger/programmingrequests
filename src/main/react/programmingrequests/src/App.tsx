import '@mantine/core/styles.css';
import classes from './App.module.css';

import { lazy, Suspense } from 'react';

import {
  ActionIcon,
  Button,
  Container,
  Divider,
  Flex,
  Space,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconHelp, IconMoon, IconSun } from '@tabler/icons-react';

import { Footer, SubmitIdeaForm } from '@/components';

const IdeasList = lazy(() => import('./components/IdeasList/IdeasList'));

function App() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const showInfo = () =>
    modals.open({
      title: 'Voting System',
      overlayProps: {
        backgroundOpacity: 0.3,
        blur: 3,
      },
      children: (
        <>
          <Text size="sm">
            In this realm of choices, you wield the power of a single vote, for or against. Should doubt cloud your
            mind, fear not: by striking with the opposite vote, you erase your past decision and regain the right to
            cast your will once more!
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

  return (
    <>
      <Space h="md" />
      <Flex mih={50} gap="md" justify="flex-end" align="flex-start" direction="row" wrap="wrap">
        <Tooltip label="Shows info about how the voting system works">
          <ActionIcon onClick={showInfo} variant="default" size="xl" aria-label="Voting system info">
            <IconHelp className="icon" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Toggle theme">
          <ActionIcon onClick={toggleColorScheme} variant="default" size="xl" aria-label="Toggle color scheme">
            <IconSun display={computedColorScheme === 'light' ? 'none' : 'block'} className="icon" stroke={1.5} />
            <IconMoon display={computedColorScheme === 'dark' ? 'none' : 'block'} className="icon" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        <Space w="xs" />
      </Flex>
      <Container className="maincontainer" my="md">
        <h1 className={classes.title}>
          <Text component="span" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} inherit>
            Programming requests
          </Text>
        </h1>
        <Space h="lg" />
        <Text size="md" c="dimmed">
          I never really thought about making a portfolio... until I realized I didn’t have one. So I decided to build
          one by creating projects with the tech I know while experimenting with new stuff. But I didn’t want to make
          the usual stuff like calculators, shopping carts, or employee databases. That’s just boring.
        </Text>
        <Space h="md" />
        <Text size="md" c="dimmed">
          So, I came up with a new project: a website where people submit project ideas. I make them, showcase them on
          another site, and boom! portfolio! There’s even a voting system, so the most popular ideas get priority. That
          way, I’m not just creating random projects, I’m letting the internet decide my fate. What could possibly go
          wrong?
        </Text>
        <Space h="xl" />
        <Divider my="md" />
        <SubmitIdeaForm />
        <Divider my="md" />
        <Suspense fallback={<div>Loading ideas...</div>}>
          <IdeasList />
        </Suspense>
      </Container>
      <Footer />
    </>
  );
}

export default App;

import { ActionIcon, Container, Space, Tooltip } from '@mantine/core';
import { IconBrandGmail, IconBrandLinkedin } from '@tabler/icons-react';

import { Group, Text } from '@mantine/core';
import classes from './Footer.module.css';
import { Logo } from '@/components';

export function Footer() {
  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logo}>
          <Logo />
        </div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text c="dimmed" size="sm">
          &#129414; 2025 Kevin Feuerschvenger. Made with &#10084; and some &#9749;.
        </Text>
        <Group gap={0} className={classes.social} justify="flex-end" wrap="nowrap">
          <Tooltip label="Checkout my LinkedIn profile!">
            <ActionIcon
              component="a"
              href="https://www.linkedin.com/in/kevin-feuerschvenger/"
              target="_blank"
              size="lg"
              color="gray"
              variant="subtle"
            >
              <IconBrandLinkedin size={38} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Space w="sm" />
          <Tooltip label="Send me a mail if you want :)">
            <ActionIcon
              component="a"
              href="mailto:kfeuerschvenger@gmail.com"
              target="_blank"
              size="lg"
              color="gray"
              variant="subtle"
            >
              <IconBrandGmail size={38} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Container>
    </footer>
  );
}

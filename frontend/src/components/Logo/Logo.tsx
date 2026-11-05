import { Image } from '@mantine/core';
import mark from '../../assets/mark-color.svg';

type LogoProps = {
  variant?: 'header' | 'footer';
};

export function Logo({ variant = 'footer' }: LogoProps) {
  const isHeader = variant === 'header';

  return <Image src={mark} h={isHeader ? 28 : undefined} w={isHeader ? 28 : undefined} alt="Code Quests" />;
}

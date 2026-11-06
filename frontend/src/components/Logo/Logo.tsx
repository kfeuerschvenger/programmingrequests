import { Image } from '@mantine/core';
import mark from '../../assets/mark-color.svg';

type LogoProps = {
  variant?: 'header' | 'footer';
  /** The name is written next to the mark, so the image adds nothing for a screen reader. */
  decorative?: boolean;
};

const SIZES = { header: 44, footer: 32 } as const;

export function Logo({ variant = 'footer', decorative = false }: LogoProps) {
  const size = SIZES[variant];

  return <Image src={mark} h={size} w={size} alt={decorative ? '' : 'Code Quests'} />;
}

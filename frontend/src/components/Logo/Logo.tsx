import { Image } from '@mantine/core';
import mark from '../../assets/mark-color.svg';

type LogoProps = {
  /** The name is written next to the mark, so the image adds nothing for a screen reader. */
  decorative?: boolean;
};

const SIZE = 32;

export function Logo({ decorative = false }: LogoProps) {
  return <Image src={mark} h={SIZE} w={SIZE} alt={decorative ? '' : 'Code Quests'} />;
}

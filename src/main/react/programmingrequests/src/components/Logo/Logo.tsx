import { Image } from '@mantine/core';
import image from '../../assets/logo.jpg';

type LogoProps = {
  variant?: 'header' | 'footer';
};

export function Logo({ variant = 'footer' }: LogoProps) {
  const isHeader = variant === 'header';

  return (
    <Image
      src={image}
      h={isHeader ? 28 : undefined}
      w={isHeader ? 28 : undefined}
      radius={isHeader ? 'xl' : 'lg'}
      alt="Logo"
    />
  );
}

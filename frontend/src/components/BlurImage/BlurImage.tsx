import { useState } from 'react';
import classes from './BlurImage.module.css';

interface BlurImageProps {
  src: string;
  lowResSrc: string;
  alt?: string;
  width?: number;
  className?: string;
}

export function BlurImage({ src, lowResSrc, alt = '', width, className }: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);

  const style = width ? { width } : undefined;

  return (
    <div className={`${classes.wrapper} ${className || ''}`} style={style}>
      <img
        src={lowResSrc}
        alt=""
        className={`${classes.image} ${classes.blur} ${loaded ? classes.hidden : ''}`}
        aria-hidden
      />
      <img
        src={src}
        alt={alt}
        className={`${classes.image} ${loaded ? classes.visible : classes.hidden}`}
        onLoad={() => {
          setLoaded(true);
          //setTimeout(() => setLoaded(true), 1500);
        }}
      />
    </div>
  );
}

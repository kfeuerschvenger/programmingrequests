import { IconBrandGithub, IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import { Logo } from '@/components/Logo/Logo';
import classes from './Footer.module.css';

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/kfeuerschvenger', Icon: IconBrandGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kevin-feuerschvenger/', Icon: IconBrandLinkedin },
  { label: 'Portfolio', href: 'https://feuerschvenger.com/', Icon: IconWorld },
] as const;

export function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.inner}>
        <div className={classes.about}>
          <Logo decorative />
          <p className={classes.credit}>
            Forged with care by <span className={classes.author}>Kevin Feuerschvenger</span>
          </p>
        </div>
        <nav aria-label="Author links">
          <ul className={classes.links}>
            {LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a className={classes.link} href={href} target="_blank" rel="noopener noreferrer">
                  <Icon size={20} stroke={1.75} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

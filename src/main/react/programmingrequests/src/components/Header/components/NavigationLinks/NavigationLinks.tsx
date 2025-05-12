import { NavLink } from 'react-router-dom';

interface Link {
  label: string;
  path: string;
}

const links: Link[] = [
  { label: 'Home', path: '/' },
  { label: 'Pixel Art', path: '/pixel-art' },
];

export function NavigationLinks({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <>
      {links.map(({ label, path }) => (
        <NavLink
          key={path}
          to={path}
          className={className}
          onClick={onClick}
          style={({ isActive }: { isActive: boolean }) => ({
            fontWeight: isActive ? 'bold' : 'normal',
          })}
        >
          {label}
        </NavLink>
      ))}
    </>
  );
}

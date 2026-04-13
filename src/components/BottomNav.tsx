import { NavLink } from 'react-router-dom';
import { Home, Scissors, Plus, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Planten', icon: Home, end: true },
  { to: '/prune', label: 'Snoeien', icon: Scissors, end: false },
  { to: '/add', label: 'Toevoegen', icon: Plus, end: false, primary: true },
  { to: '/catalog', label: 'Catalogus', icon: BookOpen, end: false },
  { to: '/settings', label: 'Instellingen', icon: Settings, end: false },
];

export function BottomNav() {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
        'md:hidden',
      )}
      aria-label="Hoofdnavigatie"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon, end, primary }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {primary ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Icon size={20} />
                </span>
              ) : (
                <Icon size={20} />
              )}
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SideNav() {
  return (
    <nav
      className="hidden w-60 shrink-0 border-r border-border bg-bg px-4 py-6 md:flex md:flex-col"
      aria-label="Hoofdnavigatie"
    >
      <div className="mb-6 px-2">
        <img
          src={`${import.meta.env.BASE_URL}wordlogo.svg`}
          alt="BladWijzer"
          className="h-8 w-auto dark:invert"
        />
      </div>
      <ul className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-fg',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

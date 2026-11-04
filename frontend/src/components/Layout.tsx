import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Avatar, Icon } from './ui';

const NAV = [
  { to: '/', label: 'Головна', icon: 'home' as const, end: true },
  { to: '/catalog', label: 'Каталог', icon: 'grid' as const },
  { to: '/fop', label: 'ФОП', icon: 'badge' as const },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src="/compass.svg" alt="" className="h-9 w-9" />
      <span className="text-sm font-semibold leading-tight text-white">
        Business
        <br />
        Navigator
      </span>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      isActive ? 'bg-brand-600/20 font-medium text-white ring-1 ring-brand-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/5 bg-ink-900 px-4 py-6 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-col gap-1" onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to={`/people/${user.id}`} className={linkClass}>
              <Icon name="user" />
              Мій профіль
            </NavLink>
          )}
        </nav>
        <p className="mt-auto px-2 text-xs leading-relaxed text-slate-500">
          Чіткіший шлях
          <br />
          до сильнішого бізнесу.
        </p>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4 lg:px-8">
          <button className="text-slate-300 lg:hidden" onClick={() => setOpen(true)} aria-label="Меню">
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          {user ? (
            <div className="flex items-center gap-3">
              <Link to={`/people/${user.id}`} className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-white/5">
                <span className="hidden text-sm text-slate-300 sm:block">{user.name}</span>
                <Avatar name={user.name} size="sm" />
              </Link>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                title="Вийти"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <Icon name="logout" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost py-2">
                Увійти
              </Link>
              <Link to="/register" className="btn-primary py-2">
                Реєстрація
              </Link>
            </div>
          )}
        </header>
        <main className="flex-1 px-5 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

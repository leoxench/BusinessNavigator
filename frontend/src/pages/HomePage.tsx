import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CatalogCounts } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Доброго ранку';
  if (h < 18) return 'Доброго дня';
  return 'Доброго вечора';
}

/** Проста стартова сторінка. Повноцінний Home (matches, збережене) — окрема задача. */
export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<CatalogCounts | null>(null);

  useEffect(() => {
    api.catalogCounts().then(setCounts).catch(() => {});
  }, []);

  const stats = [
    { label: 'Люди', value: counts?.person, to: '/catalog?type=person', icon: 'user' as const },
    { label: 'Компанії', value: counts?.company, to: '/catalog?type=company', icon: 'building' as const },
    { label: 'Можливості', value: counts?.opportunity, to: '/catalog?type=opportunity', icon: 'spark' as const },
    { label: 'ФОП', value: counts?.fop, to: '/fop', icon: 'badge' as const },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-ink-800 via-ink-850 to-ink-900 p-8 sm:p-10">
        <Mountains />
        <div className="relative max-w-xl">
          <p className="text-lg text-slate-300">
            {greeting()}
            {user ? `, ${user.name.split(' ')[0]}` : ''},
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">Великі можливості попереду.</h1>
          <p className="mt-3 text-slate-400">Знаходьте потрібних людей, компанії та можливості — в одному місці.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/catalog" className="btn-primary">
              Відкрити каталог
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            {!user && (
              <Link to="/register" className="btn-ghost">
                Створити профіль
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card p-5 transition hover:border-brand-500/30">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Icon name={s.icon} className="h-4 w-4 text-brand-400" />
              {s.label}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{s.value ?? '—'}</div>
            <div className="mt-1 text-xs text-emerald-400">Переглянути ↗</div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Mountains() {
  return (
    <svg className="pointer-events-none absolute bottom-0 right-0 h-full w-2/3 opacity-60" viewBox="0 0 400 200" preserveAspectRatio="xMaxYMax slice" aria-hidden>
      <defs>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#0e1526" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M120 200 L250 60 L290 100 L320 40 L400 130 L400 200Z" fill="url(#m1)" />
      <path d="M318 42 L310 56 L322 50 L330 58Z" fill="#e2e8f0" opacity=".7" />
      <path d="M200 200 C 240 170, 260 150, 280 130 S 310 90, 320 44" stroke="#93c5fd" strokeWidth="1.5" fill="none" strokeDasharray="3 4" opacity=".7" />
    </svg>
  );
}

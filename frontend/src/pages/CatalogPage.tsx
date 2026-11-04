import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, CatalogCounts, CatalogItem, CatalogType } from '../api';
import { Avatar, Empty, ErrorBox, Icon, PageHeader, Skeleton } from '../components/ui';

const TABS: { key: CatalogType | 'all'; label: string }[] = [
  { key: 'all', label: 'Усі' },
  { key: 'person', label: 'Люди' },
  { key: 'company', label: 'Компанії' },
  { key: 'opportunity', label: 'Можливості' },
];

const TYPE_META: Record<CatalogType, { label: string; badge: string; icon: 'user' | 'building' | 'spark' }> = {
  person: { label: 'Людина', badge: 'bg-sky-500/15 text-sky-300', icon: 'user' },
  company: { label: 'Компанія', badge: 'bg-violet-500/15 text-violet-300', icon: 'building' },
  opportunity: { label: 'Можливість', badge: 'bg-emerald-500/15 text-emerald-300', icon: 'spark' },
};

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('type');
  const type = TABS.some((t) => t.key === raw) && raw !== 'all' ? (raw as CatalogType) : undefined;

  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [counts, setCounts] = useState<CatalogCounts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.catalogCounts().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    setItems(null);
    setError('');
    api.catalog(type).then(setItems).catch((e) => setError(e.message));
  }, [type]);

  return (
    <>
      <PageHeader title="Каталог" subtitle="Люди, компанії та можливості — в одному списку." />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (type ?? 'all') === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setParams(t.key === 'all' ? {} : { type: t.key })}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                active ? 'bg-brand-600 text-white' : 'bg-ink-850 text-slate-300 ring-1 ring-white/5 hover:bg-ink-800'
              }`}
            >
              {t.label}
              {counts && <span className={`text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>{counts[t.key]}</span>}
            </button>
          );
        })}
        <Link to="/fop" className="flex items-center gap-2 rounded-xl bg-ink-850 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/5 hover:bg-ink-800">
          ФОП
          {counts && <span className="text-xs text-slate-500">{counts.fop}</span>}
        </Link>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !items ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <Empty>Тут поки порожньо.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CatalogCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const meta = TYPE_META[item.type];
  const body = (
    <>
      <div className="flex items-start gap-3">
        {item.type === 'person' ? (
          <Avatar name={item.title} />
        ) : (
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.badge}`}>
            <Icon name={meta.icon} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{item.title}</h3>
          <p className="truncate text-sm text-slate-400">{item.subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>{meta.label}</span>
      </div>
      {item.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">{item.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {item.city && (
          <span className="chip gap-1">
            <Icon name="pin" className="h-3 w-3" />
            {item.city}
          </span>
        )}
        {item.isFop && <span className="chip bg-emerald-500/10 text-emerald-300">ФОП</span>}
        {item.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
    </>
  );

  const cls = 'card flex flex-col p-5 transition';
  // Сторінки компанії та можливості — модулі Yaroslav; поки посилаємось лише на профілі людей.
  return item.type === 'person' ? (
    <Link to={`/people/${item.id}`} className={`${cls} hover:-translate-y-0.5 hover:border-brand-500/30`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

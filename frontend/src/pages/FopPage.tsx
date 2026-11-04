import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Fop } from '../api';
import { useAuth } from '../auth';
import { Avatar, Empty, ErrorBox, PageHeader } from '../components/ui';

export default function FopPage() {
  const { user } = useAuth();
  const [fops, setFops] = useState<Fop[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.fops().then(setFops).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader
        title="ФОП"
        subtitle="Фізичні особи-підприємці — одним списком."
        action={
          user && !user.isFop ? (
            <Link to="/profile/edit" className="btn-ghost">
              Я теж ФОП
            </Link>
          ) : undefined
        }
      />

      {error ? (
        <ErrorBox message={error} />
      ) : !fops ? (
        <div className="card h-72 animate-pulse" />
      ) : fops.length === 0 ? (
        <Empty>Поки що жоден учасник не позначив себе як ФОП.</Empty>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/5 bg-ink-900/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">ФОП</th>
                  <th className="px-5 py-3 font-medium">Місто</th>
                  <th className="px-5 py-3 font-medium">Вид діяльності (КВЕД)</th>
                  <th className="px-5 py-3 font-medium">Група</th>
                  <th className="px-5 py-3 font-medium">Навички</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fops.map((f) => (
                  <tr key={f.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <Link to={`/people/${f.id}`} className="flex items-center gap-3">
                        <Avatar name={f.name} size="sm" />
                        <span>
                          <span className="block font-medium text-white hover:text-brand-400">{f.name}</span>
                          <span className="block text-xs text-slate-500">{f.role || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{f.city || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-300">{f.fopActivity || '—'}</td>
                    <td className="px-5 py-3.5">
                      {f.fopGroup ? <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">{f.fopGroup}</span> : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {f.skills.slice(0, 3).map((s) => (
                          <span key={s} className="chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

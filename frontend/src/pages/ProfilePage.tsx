import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, User, WORK_FORMAT_LABEL } from '../api';
import { useAuth } from '../auth';
import { Avatar, ErrorBox, Icon } from '../components/ui';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(null);
    setError('');
    api.user(Number(id)).then(setUser).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!user) return <div className="card h-64 animate-pulse" />;

  const isMe = me?.id === user.id;
  const incomplete = !user.city || !user.role || user.skills.length === 0 || !user.bio;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card relative overflow-hidden p-7 lg:col-span-2">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
              {user.isFop && <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">ФОП</span>}
            </div>
            <p className="mt-1 text-slate-300">{user.role || <span className="text-slate-500">Роль не вказана</span>}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Icon name="pin" className="h-4 w-4" />
                {user.city || 'Місто не вказане'}
              </span>
              {user.sector && <span>Сфера: {user.sector}</span>}
              <span>{WORK_FORMAT_LABEL[user.workFormat]}</span>
            </div>
          </div>
          {isMe && (
            <Link to="/profile/edit" className="btn-ghost">
              <Icon name="edit" className="h-4 w-4" />
              Редагувати
            </Link>
          )}
        </div>

        <div className="relative mt-8">
          <h2 className="label">Про себе</h2>
          <p className="whitespace-pre-line leading-relaxed text-slate-300">{user.bio || <span className="text-slate-500">Опис ще не додано.</span>}</p>
        </div>

        <div className="relative mt-6">
          <h2 className="label">Навички</h2>
          {user.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s) => (
                <span key={s} className="rounded-lg bg-brand-600/15 px-2.5 py-1 text-sm text-brand-400 ring-1 ring-brand-500/20">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Навички не вказані.</p>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        {isMe && incomplete && (
          <div className="card border-brand-500/30 p-5">
            <h3 className="font-semibold text-white">Заповніть профіль</h3>
            <p className="mt-1 text-sm text-slate-400">Місто, роль, навички й опис допоможуть іншим знайти вас у каталозі.</p>
            <Link to="/profile/edit" className="btn-primary mt-4 w-full">
              Заповнити
            </Link>
          </div>
        )}
        {user.isFop && (
          <div className="card p-5">
            <h3 className="label">ФОП</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Група</dt>
                <dd className="text-slate-200">{user.fopGroup ? `${user.fopGroup} група` : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Вид діяльності (КВЕД)</dt>
                <dd className="mt-0.5 text-slate-200">{user.fopActivity || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
        <div className="card p-5 text-sm text-slate-400">
          На платформі з {new Date(user.createdAt).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
        </div>
      </aside>
    </div>
  );
}

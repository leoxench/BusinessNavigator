import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ErrorBox } from '../components/ui';
import AuthShell from './AuthShell';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/catalog" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Пароль має містити щонайменше 6 символів');
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Одразу після реєстрації — заповнити профіль
      navigate('/profile/edit?welcome=1', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Створити акаунт"
      subtitle="Профіль, каталог людей і компаній — за хвилину."
      footer={
        <>
          Вже маєте акаунт?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:underline">
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div>
          <label className="label" htmlFor="name">Ім'я та прізвище</label>
          <input id="name" className="input" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <input id="password" type="password" className="input" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1.5 text-xs text-slate-500">Щонайменше 6 символів.</p>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Створюємо…' : 'Зареєструватися'}
        </button>
      </form>
    </AuthShell>
  );
}

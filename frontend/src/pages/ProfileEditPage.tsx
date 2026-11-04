import { FormEvent, KeyboardEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, WORK_FORMAT_LABEL, WorkFormat } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, PageHeader } from '../components/ui';

export default function ProfileEditPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const welcome = useSearchParams()[0].get('welcome');
  const u = user!;

  const [form, setForm] = useState({
    name: u.name,
    city: u.city,
    role: u.role,
    sector: u.sector,
    bio: u.bio,
    workFormat: u.workFormat,
    isFop: u.isFop,
    fopGroup: u.fopGroup,
    fopActivity: u.fopActivity,
  });
  const [skills, setSkills] = useState<string[]>(u.skills);
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function addSkill() {
    const parts = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) setSkills((prev) => [...new Set([...prev, ...parts])].slice(0, 20));
    setSkillInput('');
  }

  function onSkillKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    } else if (e.key === 'Backspace' && !skillInput && skills.length) {
      setSkills((s) => s.slice(0, -1));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const pending = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
      const updated = await api.updateMe({ ...form, skills: [...new Set([...skills, ...pending])] });
      setUser(updated);
      navigate(`/people/${updated.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={welcome ? 'Вітаємо в Business Navigator!' : 'Редагування профілю'}
        subtitle={welcome ? 'Розкажіть коротко про себе — так вас знайдуть у каталозі.' : 'Ця інформація видима іншим учасникам.'}
      />
      <form onSubmit={onSubmit} className="card space-y-6 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Ім'я</label>
            <input id="name" className="input" required minLength={2} maxLength={80} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="city">Місто</label>
            <input id="city" className="input" placeholder="Київ" maxLength={80} value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="role">Роль</label>
            <input id="role" className="input" placeholder="Дизайнер, бухгалтер, інвестор…" maxLength={80} value={form.role} onChange={(e) => set('role', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="sector">Сфера</label>
            <input id="sector" className="input" placeholder="IT, Фінанси, Маркетинг…" maxLength={80} value={form.sector} onChange={(e) => set('sector', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="skills">Навички</label>
          <div className="input flex flex-wrap items-center gap-2 py-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-lg bg-brand-600/20 px-2 py-0.5 text-sm text-brand-400">
                {s}
                <button type="button" className="text-brand-400/70 hover:text-white" onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Прибрати ${s}`}>
                  ×
                </button>
              </span>
            ))}
            <input
              id="skills"
              className="min-w-[140px] flex-1 bg-transparent py-0.5 outline-none placeholder:text-slate-500"
              placeholder={skills.length ? '' : 'Figma, React… (Enter — додати)'}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={onSkillKey}
              onBlur={addSkill}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="bio">Короткий опис</label>
          <textarea id="bio" rows={4} className="input resize-y" maxLength={1000} placeholder="Чим займаєтесь, що шукаєте або пропонуєте" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          <p className="mt-1 text-right text-xs text-slate-500">{form.bio.length}/1000</p>
        </div>

        <div>
          <span className="label">Формат роботи</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(WORK_FORMAT_LABEL) as WorkFormat[]).map((wf) => (
              <button
                type="button"
                key={wf}
                onClick={() => set('workFormat', wf)}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  form.workFormat === wf ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {WORK_FORMAT_LABEL[wf]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-ink-900/60 p-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={form.isFop} onChange={(e) => set('isFop', e.target.checked)} />
            <span className="text-sm font-medium text-slate-200">Я — ФОП (фізична особа-підприємець)</span>
          </label>
          {form.isFop && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
              <div>
                <label className="label" htmlFor="fopGroup">Група</label>
                <select id="fopGroup" className="input" value={form.fopGroup ?? ''} onChange={(e) => set('fopGroup', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">—</option>
                  <option value="1">1 група</option>
                  <option value="2">2 група</option>
                  <option value="3">3 група</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="fopActivity">Вид діяльності (КВЕД)</label>
                <input id="fopActivity" className="input" placeholder="62.01 Комп'ютерне програмування" maxLength={160} value={form.fopActivity} onChange={(e) => set('fopActivity', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link to={`/people/${u.id}`} className="btn-ghost">
            {welcome ? 'Пізніше' : 'Скасувати'}
          </Link>
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Зберігаємо…' : 'Зберегти'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('AdminGreg');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch {
      setError('Nieprawidłowa nazwa użytkownika lub hasło.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-800 bg-slate-950/85 shadow-2xl shadow-black/40 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[520px] flex-col justify-between border-b border-slate-800 p-8 md:border-b-0 md:border-r md:p-10">
          <div>
            <div className="mb-8 inline-flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">CyberKeep</p>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Private Vault</p>
              </div>
            </div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">Biblioteka haseł i promptów pod Twoją kontrolą.</h1>
            <p className="mt-4 max-w-lg text-slate-400">
              Foldery projektów, zagnieżdżenia, kolory, prompty i zaszyfrowane hasła w jednym lokalnym monolicie.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-semibold text-slate-200">Szyfrowanie</p>
              <p>Fernet dla pól wrażliwych</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-semibold text-slate-200">Struktury</p>
              <p>Foldery bez limitu poziomów</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-semibold text-slate-200">Admin</p>
              <p>Jedno prywatne konto</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col justify-center p-8 md:p-10">
          <div className="mb-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
              <KeyRound className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Logowanie</h2>
            <p className="mt-1 text-sm text-slate-400">Wejdź do skarbca jako administrator.</p>
          </div>

          {error && <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          <label className="mb-2 text-sm font-medium text-slate-300" htmlFor="username">
            Nazwa użytkownika
          </label>
          <div className="relative mb-5">
            <User className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-800 bg-slate-900 pl-11 pr-3 text-slate-100 outline-none transition focus:border-cyan-400"
              autoComplete="username"
              required
            />
          </div>

          <label className="mb-2 text-sm font-medium text-slate-300" htmlFor="password">
            Hasło
          </label>
          <div className="relative mb-6">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-800 bg-slate-900 pl-11 pr-3 text-slate-100 outline-none transition focus:border-cyan-400"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            disabled={submitting}
            className="h-12 rounded-lg bg-cyan-500 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {submitting ? 'Sprawdzam...' : 'Otwórz skarbiec'}
          </button>
        </form>
      </section>
    </main>
  );
}


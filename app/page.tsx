'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    setLoading(false);

    if (!response.ok) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }

    router.push('/catalog');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Portal mayorista</p>
        <h1 className="mb-2 text-3xl font-bold">Solo Importado</h1>
        <p className="mb-8 text-sm text-neutral-600">Ingresá con tu usuario y contraseña para ver el catálogo.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Usuario</span>
            <input
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Contraseña</span>
            <input
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
}

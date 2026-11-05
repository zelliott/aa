import { useState, type FormEvent } from 'react';
import { api } from '../api';

export function RegisterPage({
  onRegistered,
  onLogin,
}: {
  onRegistered: () => void;
  onLogin: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api.register({
        name: String(form.get('name')),
        email: String(form.get('email')),
        password: String(form.get('password')),
      });
      onRegistered();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <h1>Pantry</h1>
      <form onSubmit={submit} className="card">
        <h2>Create an account</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} autoComplete="new-password" required />
        </label>
        <button type="submit" disabled={busy}>
          Create account
        </button>
        <p className="muted">
          Already have an account?{' '}
          <a href="/login" onClick={(e) => { e.preventDefault(); onLogin(); }}>
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}

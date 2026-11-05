import { useState, type FormEvent } from 'react';
import { api } from '../api';

export function ResetPage({ onDone }: { onDone: () => void }) {
  const token = new URLSearchParams(window.location.search).get('token');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      if (token) {
        await api.confirmReset(token, String(form.get('password')));
        onDone();
      } else {
        await api.requestReset(String(form.get('email')));
        setMessage('If that address has an account, we have sent it a reset link.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="auth">
      <h1>Pantry</h1>
      <form onSubmit={submit} className="card">
        <h2>{token ? 'Choose a new password' : 'Reset your password'}</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="notice">{message}</p>}
        {token ? (
          <label>
            New password
            <input name="password" type="password" minLength={8} autoComplete="new-password" required />
          </label>
        ) : (
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
        )}
        <button type="submit">{token ? 'Save password' : 'Send reset link'}</button>
      </form>
    </main>
  );
}

export function LoginPage({ onRegister }: { onRegister: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') ?? '/';
  const failed = params.has('error');

  return (
    <main className="auth">
      <h1>Pantry</h1>
      <form method="post" action="/api/auth/login" className="card">
        <h2>Sign in</h2>
        {failed && <p className="error">Email or password is incorrect.</p>}
        <input type="hidden" name="next" value={next} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
        <p className="muted">
          New here?{' '}
          <a href="/register" onClick={(e) => { e.preventDefault(); onRegister(); }}>
            Create an account
          </a>{' '}
          · <a href="/reset">Forgot password?</a>
        </p>
      </form>
    </main>
  );
}

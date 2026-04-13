import { Link } from '@tanstack/react-router';
import { isAuthenticated } from '../auth';

export function Home() {
  const authed = isAuthenticated();

  return (
    <div>
      <h1>Keycloak POC</h1>
      <p>
        Status: <strong>{authed ? 'Logged in' : 'Not logged in'}</strong>
      </p>
      {authed ? (
        <p>
          Go to <Link to="/dashboard">Dashboard</Link> to see your profile from
          the backend.
        </p>
      ) : (
        <p>Click <strong>Login</strong> or navigate to Dashboard to authenticate via Keycloak.</p>
      )}
    </div>
  );
}

import { trpc } from '../trpc';

export function Dashboard() {
  const me = trpc.me.useQuery();
  const secret = trpc.secret.useQuery();

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="card">
        <h3>User Profile</h3>
        {me.isLoading && <p>Loading...</p>}
        {me.error && <p>Error: {me.error.message}</p>}
        {me.data && (
          <>
            <p>Username: <code>{me.data.username}</code></p>
            <p>Email: <code>{me.data.email}</code></p>
            <p>Subject: <code>{me.data.sub}</code></p>
          </>
        )}
      </div>

      <div className="card">
        <h3>Protected Resource</h3>
        {secret.isLoading && <p>Loading...</p>}
        {secret.error && <p>Error: {secret.error.message}</p>}
        {secret.data && <p>{secret.data.message}</p>}
      </div>
    </div>
  );
}

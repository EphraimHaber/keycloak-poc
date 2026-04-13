import { useState } from 'react';
import { isAuthenticated, keycloak } from '../auth';
import { getValidToken } from '../auth';

const BACKEND = 'http://localhost:3000/trpc';

interface EndpointResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
  httpStatus?: number;
}

const endpoints = [
  {
    name: 'health',
    label: 'Public (health)',
    description: 'No auth required',
    requiredRole: null,
  },
  {
    name: 'me',
    label: 'Authenticated (me)',
    description: 'Any logged-in user',
    requiredRole: 'authenticated',
  },
  {
    name: 'viewerData',
    label: 'Viewer Data',
    description: 'Requires: viewer, manager, or admin',
    requiredRole: 'viewer',
  },
  {
    name: 'managerData',
    label: 'Manager Data',
    description: 'Requires: manager or admin',
    requiredRole: 'manager',
  },
  {
    name: 'adminData',
    label: 'Admin Data',
    description: 'Requires: admin only',
    requiredRole: 'admin',
  },
] as const;

async function callEndpoint(
  name: string,
  withAuth: boolean,
): Promise<{ ok: boolean; httpStatus: number; data: unknown }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (withAuth) {
    const token = await getValidToken();
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${BACKEND}/${name}?input={}`;
  const res = await fetch(url, { headers });
  const json = await res.json();
  return { ok: res.ok, httpStatus: res.status, data: json };
}

export function Playground() {
  const authed = isAuthenticated();
  const [results, setResults] = useState<Record<string, EndpointResult>>({});
  const [sendAuth, setSendAuth] = useState(true);

  const userRoles: string[] = authed
    ? (keycloak.tokenParsed?.realm_access?.roles ?? [])
    : [];

  async function testEndpoint(name: string) {
    setResults((prev) => ({
      ...prev,
      [name]: { status: 'loading' },
    }));

    try {
      const result = await callEndpoint(name, authed && sendAuth);
      if (result.ok) {
        setResults((prev) => ({
          ...prev,
          [name]: {
            status: 'success',
            data: result.data,
            httpStatus: result.httpStatus,
          },
        }));
      } else {
        const errorData = result.data as any;
        const msg =
          errorData?.[0]?.error?.message ||
          errorData?.error?.message ||
          JSON.stringify(errorData);
        setResults((prev) => ({
          ...prev,
          [name]: {
            status: 'error',
            error: msg,
            httpStatus: result.httpStatus,
          },
        }));
      }
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Network error',
        },
      }));
    }
  }

  function testAll() {
    for (const ep of endpoints) {
      testEndpoint(ep.name);
    }
  }

  return (
    <div>
      <h1>API Playground</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Auth Status</h3>
        {authed ? (
          <>
            <p>
              Logged in as: <code>{keycloak.tokenParsed?.preferred_username}</code>
            </p>
            <p>
              Roles:{' '}
              {userRoles.length > 0 ? (
                userRoles.map((r) => (
                  <span key={r} className="role-badge">
                    {r}
                  </span>
                ))
              ) : (
                <span style={{ color: '#999' }}>none</span>
              )}
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={sendAuth}
                onChange={(e) => setSendAuth(e.target.checked)}
              />
              Send auth token with requests
            </label>
          </>
        ) : (
          <p style={{ color: '#b45309' }}>
            Not logged in — requests will be sent without a token
          </p>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={testAll} className="btn-primary">
          Test All Endpoints
        </button>
      </div>

      <div className="endpoint-grid">
        {endpoints.map((ep) => {
          const result = results[ep.name] ?? { status: 'idle' };
          return (
            <div key={ep.name} className="endpoint-card">
              <div className="endpoint-header">
                <div>
                  <strong>{ep.label}</strong>
                  <p className="endpoint-desc">{ep.description}</p>
                </div>
                <button
                  onClick={() => testEndpoint(ep.name)}
                  disabled={result.status === 'loading'}
                >
                  {result.status === 'loading' ? '...' : 'Test'}
                </button>
              </div>
              {result.status !== 'idle' && result.status !== 'loading' && (
                <div
                  className={`endpoint-result ${result.status === 'success' ? 'result-success' : 'result-error'}`}
                >
                  {result.httpStatus && (
                    <span className="http-status">HTTP {result.httpStatus}</span>
                  )}
                  {result.status === 'success' ? (
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  ) : (
                    <pre>{result.error}</pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Test Users</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>admin</code></td>
              <td><code>admin</code></td>
              <td>
                <span className="role-badge">admin</span>
                <span className="role-badge">manager</span>
                <span className="role-badge">viewer</span>
              </td>
            </tr>
            <tr>
              <td><code>manager</code></td>
              <td><code>manager</code></td>
              <td>
                <span className="role-badge">manager</span>
                <span className="role-badge">viewer</span>
              </td>
            </tr>
            <tr>
              <td><code>viewer</code></td>
              <td><code>viewer</code></td>
              <td>
                <span className="role-badge">viewer</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

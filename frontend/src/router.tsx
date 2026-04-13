import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { isAuthenticated, login, logout } from './auth';
import { Home } from './pages/home';
import { Dashboard } from './pages/dashboard';
import { Playground } from './pages/playground';

interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
  };
}

function RootLayout() {
  const authed = isAuthenticated();

  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/playground">Playground</Link>
        <div className="spacer" />
        {authed ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <button onClick={login}>Login</button>
        )}
      </nav>
      <Outlet />
    </>
  );
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      context.auth.login();
      // Keep route in pending state while browser redirects to Keycloak
      await new Promise(() => {});
    }
  },
  component: Dashboard,
});

const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playground',
  component: Playground,
});

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute, playgroundRoute]);

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

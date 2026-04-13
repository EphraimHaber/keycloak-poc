import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from './trpc';
import { router } from './router';
import { initAuth, isAuthenticated, login, logout } from './auth';
import './index.css';

const queryClient = new QueryClient();
const trpcClient = createTRPCClient();

async function main() {
  await initAuth();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider
            router={router}
            context={{
              auth: {
                isAuthenticated: isAuthenticated(),
                login,
                logout,
              },
            }}
          />
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>,
  );
}

main();

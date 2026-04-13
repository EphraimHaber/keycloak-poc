import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/router.js';
import { getValidToken } from './auth.js';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/trpc',
        async headers() {
          const token = await getValidToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

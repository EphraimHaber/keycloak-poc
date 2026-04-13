import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'my-app';

const jwks = createRemoteJWKSet(
  new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`),
);

export interface User {
  sub: string;
  email?: string;
  preferredUsername?: string;
  roles: string[];
}

export async function createContext({ req }: CreateFastifyContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return { user: null };
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${KEYCLOAK_URL}/realms/${REALM}`,
    });

    const realmAccess = payload.realm_access as
      | { roles?: string[] }
      | undefined;

    return {
      user: {
        sub: payload.sub!,
        email: payload.email as string | undefined,
        preferredUsername: payload.preferred_username as string | undefined,
        roles: realmAccess?.roles ?? [],
      } satisfies User,
    };
  } catch {
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

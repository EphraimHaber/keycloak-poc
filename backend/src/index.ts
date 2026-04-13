import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router.js';
import { createContext } from './context.js';

const server = Fastify({ logger: true });

await server.register(cors, { origin: 'http://localhost:5173' });

await server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

await server.listen({ port: 3000 });
console.log('Backend running on http://localhost:3000');

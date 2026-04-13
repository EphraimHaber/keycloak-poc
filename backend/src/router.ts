import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});

function requireRole(...roles: string[]) {
  return isAuthed.unstable_pipe(({ ctx, next }) => {
    const hasRole = roles.some((role) => ctx.user.roles.includes(role));
    if (!hasRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Requires one of: ${roles.join(', ')}`,
      });
    }
    return next({ ctx });
  });
}

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
const viewerProcedure = t.procedure.use(requireRole('viewer', 'manager', 'admin'));
const managerProcedure = t.procedure.use(requireRole('manager', 'admin'));
const adminProcedure = t.procedure.use(requireRole('admin'));

export const appRouter = t.router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    message: 'Public endpoint - no auth required.',
  })),

  me: protectedProcedure.query(({ ctx }) => ({
    sub: ctx.user.sub,
    email: ctx.user.email,
    username: ctx.user.preferredUsername,
    roles: ctx.user.roles,
  })),

  viewerData: viewerProcedure.query(() => ({
    message: 'You have viewer access. Any authenticated user with viewer/manager/admin role can see this.',
  })),

  managerData: managerProcedure.query(() => ({
    message: 'You have manager access. Only manager and admin roles can see this.',
  })),

  adminData: adminProcedure.query(() => ({
    message: 'You have admin access. Only the admin role can see this.',
  })),
});

export type AppRouter = typeof appRouter;

import { Context, Next } from 'hono';
import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export async function authMiddleware(c: Context, next: Next) {
  const sessionId = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    return c.json({ error: 'Session expired' }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) {
    return c.json({ error: 'User not found or inactive' }, 401);
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture || undefined,
  });

  await next();
}

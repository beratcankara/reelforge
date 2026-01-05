import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = new Hono();

// Google OAuth login URL
router.get('/google', (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = 'openid email profile';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}`;

  return c.json({ authUrl });
});

// Google OAuth callback
router.get('/google/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.json({ error: 'No authorization code provided' }, 400);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return c.json({ error: 'Failed to get access token' }, 400);
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    // Check if user email matches allowed admin email
    if (googleUser.email !== process.env.ADMIN_EMAIL) {
      return c.json({ error: 'Unauthorized: Only admin email is allowed' }, 403);
    }

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    if (!user) {
      const userId = nanoid();
      [user] = await db
        .insert(users)
        .values({
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.id,
          lastLoginAt: new Date(),
        })
        .returning();
    } else {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));
    }

    // Create session
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    // Redirect to frontend with session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return c.redirect(`${frontendUrl}/auth/callback?session=${sessionId}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Get current user
router.get('/me', async (c) => {
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
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      picture: users.picture,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});

// Logout
router.post('/logout', async (c) => {
  const sessionId = c.req.header('Authorization')?.replace('Bearer ', '');

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  return c.json({ success: true });
});

export default router;

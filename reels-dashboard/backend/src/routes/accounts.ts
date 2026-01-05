import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { instagramAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get all Instagram accounts
router.get('/', async (c) => {
  const accounts = await db.select().from(instagramAccounts);
  return c.json({ accounts });
});

// Get single account
router.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const [account] = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.id, id))
    .limit(1);

  if (!account) {
    return c.json({ error: 'Account not found' }, 404);
  }

  return c.json({ account });
});

// Toggle account active status
router.patch('/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'));

  const [account] = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.id, id))
    .limit(1);

  if (!account) {
    return c.json({ error: 'Account not found' }, 404);
  }

  const [updated] = await db
    .update(instagramAccounts)
    .set({ isActive: !account.isActive, updatedAt: new Date() })
    .where(eq(instagramAccounts.id, id))
    .returning();

  return c.json({ account: updated });
});

export default router;

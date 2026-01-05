import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get all settings
router.get('/', async (c) => {
  const category = c.req.query('category');

  let query = db.select().from(settings);

  if (category) {
    query = query.where(eq(settings.category, category)) as any;
  }

  const allSettings = await query;

  return c.json({ settings: allSettings });
});

// Get setting by key
router.get('/:key', async (c) => {
  const key = c.req.param('key');

  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (!setting) {
    return c.json({ error: 'Setting not found' }, 404);
  }

  return c.json({ setting });
});

// Update setting
router.put('/:key', async (c) => {
  const key = c.req.param('key');
  const user = c.get('user');
  const body = await c.req.json();

  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (!setting) {
    // Create new setting
    const [newSetting] = await db
      .insert(settings)
      .values({
        key,
        value: body.value,
        category: body.category || 'general',
        updatedBy: user.id,
      })
      .returning();

    return c.json({ setting: newSetting });
  }

  // Update existing setting
  const [updated] = await db
    .update(settings)
    .set({
      value: body.value,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(settings.key, key))
    .returning();

  return c.json({ setting: updated });
});

export default router;

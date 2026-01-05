import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get notifications for current user
router.get('/', async (c) => {
  const user = c.get('user');
  const unreadOnly = c.req.query('unreadOnly') === 'true';

  let query = db.select().from(notifications).where(eq(notifications.userId, user.id));

  if (unreadOnly) {
    query = query.where(eq(notifications.isRead, false)) as any;
  }

  const userNotifications = await query.orderBy(desc(notifications.createdAt)).limit(50);

  return c.json({ notifications: userNotifications });
});

// Mark notification as read
router.patch('/:id/read', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const [notification] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();

  if (!notification) {
    return c.json({ error: 'Notification not found' }, 404);
  }

  return c.json({ notification });
});

// Mark all as read
router.post('/read-all', async (c) => {
  const user = c.get('user');

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, user.id));

  return c.json({ success: true });
});

export default router;

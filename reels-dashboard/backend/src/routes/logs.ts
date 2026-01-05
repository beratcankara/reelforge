import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { systemLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get logs with filters
router.get('/', async (c) => {
  const level = c.req.query('level'); // info, warning, error
  const source = c.req.query('source');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = db.select().from(systemLogs);

  if (level) {
    query = query.where(eq(systemLogs.level, level)) as any;
  }

  if (source) {
    query = query.where(eq(systemLogs.source, source)) as any;
  }

  const logs = await query
    .orderBy(desc(systemLogs.timestamp))
    .limit(limit)
    .offset(offset);

  return c.json({ logs });
});

export default router;

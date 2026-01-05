import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { analyticsSnapshots, instagramAccounts } from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get analytics overview
router.get('/overview', async (c) => {
  const period = c.req.query('period') || 'daily'; // daily, weekly, monthly
  const accountId = c.req.query('accountId');

  let query = db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.period, period));

  if (accountId) {
    query = query.where(
      and(
        eq(analyticsSnapshots.period, period),
        eq(analyticsSnapshots.accountId, parseInt(accountId))
      )
    ) as any;
  }

  const snapshots = await query.orderBy(desc(analyticsSnapshots.snapshotDate)).limit(30);

  return c.json({ snapshots });
});

// Get analytics for specific account
router.get('/account/:accountId', async (c) => {
  const accountId = parseInt(c.req.param('accountId'));
  const days = parseInt(c.req.query('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await db
    .select()
    .from(analyticsSnapshots)
    .where(
      and(
        eq(analyticsSnapshots.accountId, accountId),
        gte(analyticsSnapshots.snapshotDate, startDate)
      )
    )
    .orderBy(desc(analyticsSnapshots.snapshotDate));

  return c.json({ snapshots });
});

export default router;

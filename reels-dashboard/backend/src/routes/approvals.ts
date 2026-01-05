import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { approvals } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = new Hono();

// All routes require authentication
router.use('*', authMiddleware);

// Get all approvals with filters
router.get('/', async (c) => {
  const status = c.req.query('status'); // pending, approved, rejected
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = db.select().from(approvals);

  if (status) {
    query = query.where(eq(approvals.status, status)) as any;
  }

  const items = await query
    .orderBy(desc(approvals.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ approvals: items });
});

// Get single approval
router.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [approval] = await db
    .select()
    .from(approvals)
    .where(eq(approvals.id, id))
    .limit(1);

  if (!approval) {
    return c.json({ error: 'Approval not found' }, 404);
  }

  return c.json({ approval });
});

// Approve a reel
router.post('/:id/approve', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const [approval] = await db
    .update(approvals)
    .set({
      status: 'approved',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, id))
    .returning();

  if (!approval) {
    return c.json({ error: 'Approval not found' }, 404);
  }

  // TODO: Trigger n8n workflow to post the reel

  return c.json({ approval });
});

// Reject a reel
router.post('/:id/reject', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();

  const [approval] = await db
    .update(approvals)
    .set({
      status: 'rejected',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      rejectionReason: body.reason,
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, id))
    .returning();

  if (!approval) {
    return c.json({ error: 'Approval not found' }, 404);
  }

  return c.json({ approval });
});

// Update approval (edit caption, hashtags, etc.)
router.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const [approval] = await db
    .update(approvals)
    .set({
      caption: body.caption,
      hashtags: body.hashtags,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      priority: body.priority,
      updatedAt: new Date(),
    })
    .where(and(eq(approvals.id, id), eq(approvals.status, 'pending')))
    .returning();

  if (!approval) {
    return c.json({ error: 'Approval not found or already reviewed' }, 404);
  }

  return c.json({ approval });
});

// Get approval statistics
router.get('/stats/overview', async (c) => {
  // This is a simplified version - in production, use aggregation queries
  const allApprovals = await db.select().from(approvals);

  const stats = {
    total: allApprovals.length,
    pending: allApprovals.filter(a => a.status === 'pending').length,
    approved: allApprovals.filter(a => a.status === 'approved').length,
    rejected: allApprovals.filter(a => a.status === 'rejected').length,
  };

  return c.json({ stats });
});

export default router;

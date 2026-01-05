import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { workflowStatus } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.use('*', authMiddleware);

// Get all workflows
router.get('/', async (c) => {
  const workflows = await db.select().from(workflowStatus);
  return c.json({ workflows });
});

// Get single workflow
router.get('/:id', async (c) => {
  const workflowId = c.req.param('id');

  const [workflow] = await db
    .select()
    .from(workflowStatus)
    .where(eq(workflowStatus.workflowId, workflowId))
    .limit(1);

  if (!workflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  return c.json({ workflow });
});

// Toggle workflow active status
router.post('/:id/toggle', async (c) => {
  const workflowId = c.req.param('id');

  const [workflow] = await db
    .select()
    .from(workflowStatus)
    .where(eq(workflowStatus.workflowId, workflowId))
    .limit(1);

  if (!workflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  const [updated] = await db
    .update(workflowStatus)
    .set({ isActive: !workflow.isActive, updatedAt: new Date() })
    .where(eq(workflowStatus.workflowId, workflowId))
    .returning();

  // TODO: Call n8n API to activate/deactivate workflow

  return c.json({ workflow: updated });
});

export default router;

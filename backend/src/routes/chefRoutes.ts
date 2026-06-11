import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CHEF']), requireBranch);

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where: { branchId, status: { in: ['PENDING', 'PREPARING'] } },
    include: { items: { include: { menuItem: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(orders);
});

router.patch('/orders/:id/done', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  if (!order.paid) {
    res.status(400).json({ error: 'Order has not been paid yet.' });
    return;
  }
  const updated = await prisma.order.update({ where: { id }, data: { status: 'DONE' } });
  res.json(updated);
});

router.get('/menu', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const items = await prisma.menuItem.findMany({ where: { branchId } });
  res.json(items);
});

router.post('/menu', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const { name, description, price, category, isAvailable } = req.body as { name?: string; description?: string; price?: number; category?: string; isAvailable?: boolean };

  if (!name || typeof name !== 'string' || !category || typeof category !== 'string' || typeof price !== 'number' || Number.isNaN(price)) {
    res.status(400).json({ error: 'name, category and numeric price are required.' });
    return;
  }

  try {
    const created = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description ?? '',
        price: Number(price),
        category: category.trim(),
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        branchId,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error('Failed to create menu item', e);
    res.status(500).json({ error: 'Failed to create menu item.' });
  }
});

router.delete('/menu/:id', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item || item.branchId !== branchId) {
    res.status(403).json({ error: 'Menu item not found in your branch.' });
    return;
  }
  await prisma.menuItem.delete({ where: { id } });
  res.json({ message: 'Menu item deleted.' });
});

export default router;

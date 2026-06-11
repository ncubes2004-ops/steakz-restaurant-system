import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CASHIER']), requireBranch);

router.post('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const { customerId, items } = req.body as { customerId?: number; items: { menuItemId?: number; name?: string; quantity: number }[] };

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'At least one item is required.' });
    return;
  }

  // Resolve items: allow either menuItemId or name from the cashier UI
  const resolvedItems: { menuItemId: number; unitPrice: number; quantity: number }[] = [];
  for (const it of items) {
    if (typeof it.menuItemId === 'number') {
      const mi = await prisma.menuItem.findUnique({ where: { id: it.menuItemId } });
      if (!mi || mi.branchId !== branchId) {
        res.status(400).json({ error: `Menu item ${it.menuItemId} not found in this branch.` });
        return;
      }
      resolvedItems.push({ menuItemId: mi.id, unitPrice: mi.price, quantity: it.quantity });
    } else if (typeof it.name === 'string') {
      const mi = await prisma.menuItem.findFirst({ where: { name: it.name, branchId } });
      if (!mi) {
        res.status(400).json({ error: `Menu item '${it.name}' not found in this branch.` });
        return;
      }
      resolvedItems.push({ menuItemId: mi.id, unitPrice: mi.price, quantity: it.quantity });
    } else {
      res.status(400).json({ error: 'Each item must include either menuItemId or name.' });
      return;
    }
  }

  const total = resolvedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  const orderData: any = {
    branchId,
    customerId: customerId ?? undefined,
    total,
    items: {
      create: resolvedItems.map((it) => ({
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    },
  };

  const order = await prisma.order.create({
    data: orderData,
    include: {
      items: { include: { menuItem: true } },
    },
  });

  res.status(201).json(order);
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  // allow optional filtering by status (comma separated) and since (ISO date) for shift-scoped views
  const statusQ = typeof req.query.status === 'string' ? req.query.status.split(',').map((s) => s.trim().toUpperCase()) : undefined;
  const sinceQ = typeof req.query.since === 'string' ? new Date(req.query.since) : undefined;

  const where: any = { branchId };
  if (statusQ && statusQ.length > 0) where.status = { in: statusQ };
  if (sinceQ && !isNaN(sinceQ.getTime())) where.createdAt = { gte: sinceQ };

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { menuItem: true } }, booking: { include: { table: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.patch('/orders/:id/pay', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const cashierId = req.user!.id;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  if (order.paid) {
    res.status(400).json({ error: 'Order already paid.' });
    return;
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { paid: true, paidAt: new Date(), paidById: cashierId, status: 'PREPARING' },
  });
  res.json(updated);
});

router.patch('/orders/:id/deliver', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }
  const updated = await prisma.order.update({ where: { id }, data: { status: 'DELIVERED' } });
  res.json(updated);
});

// Cashier: confirm a pending booking when customer arrives
router.patch('/bookings/:id/confirm', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const booking = await prisma.booking.findUnique({ where: { id }, include: { table: true } });
  if (!booking || !booking.table || booking.table.branchId !== branchId) {
    res.status(403).json({ error: 'Booking not found in your branch.' });
    return;
  }
  if (booking.status === 'CONFIRMED') {
    res.status(400).json({ error: 'Booking already confirmed.' });
    return;
  }

  // Mark booking confirmed and mark the table as not available
  const updated = await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED' } }),
    prisma.table.update({ where: { id: booking.tableId }, data: { isAvailable: false } }),
  ]);

  res.json({ booking: updated[0], table: updated[1] });
});

  // Cashier: cancel a booking (free up the table)
  router.patch('/bookings/:id/cancel', async (req: Request, res: Response) => {
    const branchId = req.user!.branchId!;
    const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
    const booking = await prisma.booking.findUnique({ where: { id }, include: { table: true } });
    if (!booking || !booking.table || booking.table.branchId !== branchId) {
      res.status(403).json({ error: 'Booking not found in your branch.' });
      return;
    }
    if (booking.status === 'CANCELLED') {
      res.status(400).json({ error: 'Booking already cancelled.' });
      return;
    }

    // Mark booking cancelled and mark the table as available
    const updated = await prisma.$transaction([
      prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }),
      prisma.table.update({ where: { id: booking.tableId }, data: { isAvailable: true } }),
    ]);

    res.json({ booking: updated[0], table: updated[1] });
  });

// Cashier: list bookings for branch (optionally filter by status)
router.get('/bookings', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const statusQ = typeof req.query.status === 'string' ? req.query.status.split(',').map(s => s.trim().toUpperCase()) : undefined;
  const where: any = { table: { branchId } };
  if (statusQ && statusQ.length > 0) where.status = { in: statusQ };

  const bookings = await prisma.booking.findMany({
    where: { table: { branchId } },
    include: { table: true, customer: { select: { id: true, name: true, email: true } } },
    orderBy: { date: 'asc' },
  });
  res.json(bookings);
});

export default router;

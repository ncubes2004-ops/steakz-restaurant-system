import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CUSTOMER']));

router.get('/bookings', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const bookings = await prisma.booking.findMany({
    where: { customerId },
    include: { table: { include: { branch: { select: { name: true } } } } },
    orderBy: { date: 'desc' },
  });
  res.json(bookings);
});

router.post('/bookings', async (req: Request, res: Response) => {
  const customerId = req.user!.id;

  const { tableId, guestCount, date } = req.body as {
    tableId: number;
    guestCount: number;
    date: string;
  };

  if (!tableId || !guestCount || !date) {
    res.status(400).json({ error: 'tableId, guestCount and date are required.' });
    return;
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isAvailable) {
    res.status(400).json({ error: 'Table is not available.' });
    return;
  }

  const booking = await prisma.booking.create({
    data: { customerId, tableId, guestCount, date: new Date(date) },
    include: { table: { include: { branch: { select: { name: true } } } } },
  });
  res.status(201).json(booking);
});

router.delete('/bookings/:id', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const id = parseInt(typeof req.params['id'] === 'string' ? req.params['id'] : '0');
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.customerId !== customerId) {
    res.status(403).json({ error: 'Booking not found.' });
    return;
  }
  await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
  res.json({ message: 'Booking cancelled.' });
});

router.get('/orders', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { menuItem: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.post('/orders', async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { bookingId, items } = req.body as {
    bookingId?: number;
    items: { menuItemId: number; quantity: number }[];
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'items are required.' });
    return;
  }

  let branchId: number | null = null;
  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { table: true } });
    if (!booking || booking.customerId !== customerId) {
      res.status(403).json({ error: 'Booking not found.' });
      return;
    }
    branchId = booking.table.branchId;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((item) => item.menuItemId) } },
  });

  if (menuItems.length !== items.length) {
    res.status(400).json({ error: 'One or more items are invalid.' });
    return;
  }

  const branchIds = Array.from(new Set(menuItems.map((item) => item.branchId)));
  if (branchIds.length !== 1) {
    res.status(400).json({ error: 'Order items must come from a single branch.' });
    return;
  }

  if (!branchId) {
    branchId = branchIds[0]!;
  } else if (branchId !== branchIds[0]) {
    res.status(400).json({ error: 'Booking branch does not match selected items.' });
    return;
  }

  const orderBranchId = branchId ?? branchIds[0]!;
  const priceMap = Object.fromEntries(menuItems.map((m) => [m.id, m.price]));
  const total = items.reduce((sum, item) => sum + (priceMap[item.menuItemId] ?? 0) * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      customerId,
      bookingId: bookingId ?? null,
      branchId: orderBranchId,
      total,
      items: {
        create: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: priceMap[item.menuItemId] ?? 0,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  res.status(201).json(order);
});

export default router;

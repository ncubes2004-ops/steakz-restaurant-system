import prisma from '../src/lib/prisma';

(async () => {
  try {
    console.log('Clearing reservations: setting all tables to available and cancelling active bookings...');

    // Mark all tables as available
    const tablesRes = await prisma.table.updateMany({ data: { isAvailable: true } });

    // Cancel bookings that are not already cancelled or completed
    const bookingsRes = await prisma.booking.updateMany({
      where: { status: { notIn: ['CANCELLED', 'COMPLETED'] } },
      data: { status: 'CANCELLED' },
    });

    console.log(`Tables updated: ${tablesRes.count}`);
    console.log(`Bookings updated: ${bookingsRes.count}`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to clear reservations:', e);
    process.exit(1);
  }
})();

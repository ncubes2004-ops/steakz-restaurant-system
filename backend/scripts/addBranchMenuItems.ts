import prisma from '../src/lib/prisma.ts';

async function run() {
  const branchId = 1;
  const items = [
    { name: 'Smoky Ribeye', description: 'Smoked ribeye with herbs', price: 32.5, category: 'Steaks', isAvailable: true },
    { name: 'Garlic Butter Prawns', description: 'Prawns in garlic butter', price: 14.0, category: 'Starters', isAvailable: true },
    { name: 'Truffle Fries', description: 'Fries with truffle oil', price: 6.5, category: 'Sides', isAvailable: true },
    { name: 'Blue Cheese Salad', description: 'Mixed greens with blue cheese', price: 10.0, category: 'Starters', isAvailable: true },
    { name: 'Molten Chocolate Cake', description: 'Warm chocolate cake with molten center', price: 8.0, category: 'Desserts', isAvailable: true },
    { name: 'House IPA', description: 'Local craft IPA', price: 6.0, category: 'Drinks', isAvailable: true },
  ];

  try {
    for (const it of items) {
      const exists = await prisma.menuItem.findFirst({ where: { name: it.name, branchId } });
      if (exists) {
        console.log('exists, skipping:', it.name);
        continue;
      }
      const created = await prisma.menuItem.create({ data: { ...it, branchId } });
      console.log('created:', created.name, created.id);
    }
  } catch (e) {
    console.error('error creating menu items', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

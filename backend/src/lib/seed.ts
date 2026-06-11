import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { fileURLToPath } from 'url';

const CUSTOMER_EMAIL = process.env['CUSTOMER_EMAIL'] ?? 'customer@steakz.com';
const CUSTOMER_PASSWORD = process.env['CUSTOMER_PASSWORD'] ?? 'customer123';

const BRANCHES = [
  { oldName: 'Steakz City Centre',  name: 'Crimson Sear',   address: '256 Broadway Ave, Downtown', phone: '020 0000 0001' },
  { oldName: 'Steakz Northside',    name: 'Blackstone Grill', address: '823 Maple Street, North District', phone: '020 0000 0002' },
  { oldName: 'Steakz Southgate',    name: 'Iron Oak Tavern',  address: '512 Ocean Drive, Beachfront', phone: '020 0000 0003' },
  { oldName: 'Steakz East Quarter', name: 'Ember Alley',     address: '341 Riverside Blvd, Riverside', phone: '020 0000 0004' },
  { oldName: 'Steakz Westfield',    name: 'Raven Steakhouse', address: '678 Oak Avenue, Westbrook', phone: '020 0000 0005' },
  { oldName: 'Steakz Marina Bay',   name: 'Charcoal Cove',   address: '105 Harbor Lane, Waterfront', phone: '020 0000 0006' },
  { oldName: 'Steakz Uptown',       name: 'The Flame Loft',  address: '999 Fifth Street, Premium District', phone: '020 0000 0007' },
];

const MENU_ITEMS = [
  { name: 'Ribeye Steak', description: '12 oz premium ribeye', price: 29.99, category: 'Steaks' },
  { name: 'Caesar Salad', description: 'Crisp romaine, Caesar dressing', price: 9.5, category: 'Starters' },
  { name: 'Grilled Asparagus', description: 'Charred asparagus with lemon', price: 8.25, category: 'Sides' },
  { name: 'Garlic Butter Shrimp', description: 'Seven shrimp with garlic butter', price: 14.75, category: 'Starters' },
  { name: 'Chocolate Lava Cake', description: 'Warm cake with melting center', price: 7.5, category: 'Desserts' },
  { name: 'House Wine', description: 'Red or white by the glass', price: 12.5, category: 'Drinks' },
];

export async function seed() {
  let firstBranchId: number | null = null;

  // STEP 1: Always seed branches first so we have IDs to link users to!
  for (const branchData of BRANCHES) {
    let branch = await prisma.branch.findUnique({ where: { name: branchData.name } });
    if (!branch && branchData.oldName) {
      branch = await prisma.branch.findUnique({ where: { name: branchData.oldName } });
    }

    if (!branch) {
      try {
        branch = await prisma.branch.create({
          data: {
            name: branchData.name,
            address: branchData.address,
            phone: branchData.phone,
          },
        });
        console.log(`[Seeder] Branch created: ${branch.name}`);
      } catch (err) {
        console.error('[Seeder] Error creating branch, attempting to recover:', err instanceof Error ? err.message : err);
        // Try to recover by re-querying an existing branch by either name or oldName
        branch = await prisma.branch.findFirst({ where: { OR: [{ name: branchData.name }, { name: branchData.oldName }] } });
        if (branch) {
          console.log(`[Seeder] Recovered existing branch: ${branch.name}`);
        } else {
          throw err;
        }
      }
    } else if (branch.name !== branchData.name || branch.address !== branchData.address || branch.phone !== branchData.phone) {
      branch = await prisma.branch.update({
        where: { id: branch.id },
        data: {
          name: branchData.name,
          address: branchData.address,
          phone: branchData.phone,
        },
      });
      console.log(`[Seeder] Branch renamed/updated: ${branch.name}`);
    }

    // Capture the very first branch ID to use as a structural fallback for the admin
    if (!firstBranchId) {
      firstBranchId = branch.id;
    }

    const tableCount = 3 + Math.floor(Math.random() * 3);
    const existingTables = await prisma.table.count({ where: { branchId: branch.id } });

    if (existingTables < tableCount) {
      const tables = Array.from({ length: tableCount - existingTables }, (_, index) => ({
        tableNumber: existingTables + index + 1,
        capacity: 4,
        isAvailable: true,
        branchId: branch!.id,
      }));
      await prisma.table.createMany({ data: tables });
      console.log(`[Seeder] Added ${tables.length} tables to ${branch.name}`);
    }

    const existingItems = await prisma.menuItem.count({ where: { branchId: branch.id } });
      // Ensure each sample menu item exists for the branch; create only missing items.
      for (const item of MENU_ITEMS) {
        const itemExists = await prisma.menuItem.findFirst({ where: { name: item.name, branchId: branch.id } });
        if (!itemExists) {
          await prisma.menuItem.create({ data: { ...item, branchId: branch.id } });
          console.log(`[Seeder] Added menu item ${item.name} to ${branch.name}`);
        }
      }
  }

  // STEP 2: Securely seed the Admin using the guaranteed branch ID
  const email    = process.env['ADMIN_EMAIL']    ?? 'admin@steakz.com';
  const password = process.env['ADMIN_PASSWORD'] ?? 'admin123';

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { 
        name: 'System Admin', 
        email, 
        password: hashed, 
        role: 'ADMIN',
        isActive: true,
        branchId: firstBranchId ?? 1 // Bypasses the strict database constraint cleanly!
      },
    });
    console.log(`[Seeder] Admin created successfully: ${email}`);
  } else {
    console.log('[Seeder] Admin already exists — skipping.');
  }

  // STEP 3: Seed the Test Customer
  const existingCustomer = await prisma.user.findUnique({ where: { email: CUSTOMER_EMAIL } });
  if (!existingCustomer) {
    const hashedCustomer = await bcrypt.hash(CUSTOMER_PASSWORD, 10);
    await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: CUSTOMER_EMAIL,
        password: hashedCustomer,
        role: 'CUSTOMER',
        isActive: true,
        branchId: firstBranchId ?? 1
      },
    });
    console.log(`[Seeder] Customer created: ${CUSTOMER_EMAIL}`);
  } else {
    console.log('[Seeder] Customer already exists — skipping.');
  }
}

// If this file is executed directly (node ./src/lib/seed.ts or node ./dist/lib/seed.js), run the seeder.
try {
  const entryScript = process.argv[1];
  if (entryScript && fileURLToPath(import.meta.url) === entryScript) {
    seed()
      .then(() => {
        console.log('[Seeder] Seed completed successfully.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('[Seeder] Fatal error:', err);
        process.exit(1);
      });
  }
} catch (err) {
  // Defensive: log any synchronous check errors and continue
  console.error('[Seeder] Invocation check failed:', err);
}
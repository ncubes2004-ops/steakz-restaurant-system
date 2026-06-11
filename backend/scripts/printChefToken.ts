import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

(async () => {
  try {
    const email = process.env['CHEF_EMAIL'] ?? 'chef@steakz.com';
    const password = process.env['CHEF_PASSWORD'] ?? 'chef123';
    const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret';
    const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '7d';

    // ensure there's at least one branch to attach the chef to
    const branch = await prisma.branch.findFirst();
    if (!branch) {
      console.error('No branch found in DB. Run the seeder first.');
      process.exit(1);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = await prisma.user.create({ data: { name: 'Seed Chef', email, password: hashed, role: 'CHEF', branchId: branch.id } });
      console.log(`Created chef user: ${email} (branch ${branch.name})`);
    } else {
      console.log(`Found existing user: ${email}`);
      // ensure role/branch
      if (user.role !== 'CHEF' || user.branchId !== branch.id) {
        user = await prisma.user.update({ where: { id: user.id }, data: { role: 'CHEF', branchId: branch.id } });
        console.log('Updated existing user to CHEF role and assigned branch.');
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role, branchId: user.branchId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log('\n=== Chef JWT (copy to Authorization header) ===');
    console.log(token);
    console.log('=============================================\n');
    console.log('Example curl:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3002/api/chef/menu`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to create/print chef token', e);
    process.exit(1);
  }
})();

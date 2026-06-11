import prisma from '../src/lib/prisma.ts';

(async function main(){
  try{
    const items = await prisma.menuItem.findMany({ where: { branchId: 1 }, orderBy: { id: 'asc' } });
    console.log(JSON.stringify(items.map(m=>({ id: m.id, name: m.name, price: m.price, category: m.category, isAvailable: m.isAvailable })), null, 2));
  }catch(e){
    console.error(e);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
  process.exit(0);
})();

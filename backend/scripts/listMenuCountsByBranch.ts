import prisma from '../src/lib/prisma.ts';

(async function main(){
  try{
    const branches = await prisma.branch.findMany({ include: { menuItems: true } });
    const summary = branches.map(b => ({ id: b.id, name: b.name, menuCount: b.menuItems.length, menuNames: b.menuItems.map(mi => mi.name) }));
    console.log(JSON.stringify(summary, null, 2));
  }catch(e){
    console.error(e);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
  process.exit(0);
})();

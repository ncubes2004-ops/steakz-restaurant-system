import prisma from '../src/lib/prisma.ts';

(async function main(){
  try{
    const branches = await prisma.branch.count();
    const menu = await prisma.menuItem.count();
    const users = await prisma.user.count();
    console.log(JSON.stringify({ branches, menu, users }, null, 2));
  }catch(e){
    console.error(e);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
  process.exit(0);
})();

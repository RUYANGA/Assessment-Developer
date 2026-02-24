const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    await p.$connect();
    console.log('PRISMA CONNECTED');
    const u = await p.user.findFirst();
    console.log('FIND FIRST OK', u);
  } catch (e) {
    console.error('PRISMA ERR', e);
  } finally {
    await p.$disconnect();
  }
})();

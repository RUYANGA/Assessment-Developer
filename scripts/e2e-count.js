const { PrismaClient } = require('@prisma/client');
const articleId = process.argv[2];
(async () => {
    const p = new PrismaClient();
    try {
        await p.$connect();
        const c = await p.readLog.count({ where: { articleId } });
        console.log('read_log_count:' + c);
    } catch (e) {
        console.error('ERR', e);
        process.exit(1);
    } finally {
        await p.$disconnect();
    }
})();

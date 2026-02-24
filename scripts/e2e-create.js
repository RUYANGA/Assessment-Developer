const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
    const p = new PrismaClient();
    try {
        await p.$connect();
        const email = 'e2e.author.' + Date.now() + '@example.com';
        const hashed = bcrypt.hashSync('Password1!', 10);
        const user = await p.user.create({
            data: { name: 'E2E Author', email, password: hashed, role: 'AUTHOR' },
        });
        console.log('created user', user.id);
        const article = await p.article.create({
            data: {
                title: 'E2E Test Article',
                content: 'This is test content with enough length to pass validation. '.repeat(3),
                category: 'Tech',
                status: 'PUBLISHED',
                authorId: user.id,
            },
        });
        console.log('created article', article.id);
        console.log(JSON.stringify({ userId: user.id, articleId: article.id }));
    } catch (e) {
        console.error('ERR', e);
        process.exit(1);
    } finally {
        await p.$disconnect();
    }
})();

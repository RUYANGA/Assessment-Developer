import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async aggregateDailyStats() {
        // Get the previous day in GMT
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);

        const startOfDay = new Date(yesterday);
        const endOfDay = new Date(yesterday);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Group read logs by articleId
        const stats = await (this.prisma as any).readLog.groupBy({
            by: ['articleId'],
            where: {
                readAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            _count: {
                id: true,
            },
        });

        // Upsert into DailyAnalytics
        for (const stat of stats) {
            await (this.prisma as any).dailyAnalytics.upsert({
                where: {
                    articleId_date: {
                        articleId: stat.articleId,
                        date: startOfDay,
                    },
                },
                update: {
                    viewCount: stat._count.id,
                },
                create: {
                    articleId: stat.articleId,
                    date: startOfDay,
                    viewCount: stat._count.id,
                },
            });
        }

        return stats.length;
    }

    async getAuthorDashboard(authorId: string, page = 1, size = 10) {
        const skip = (page - 1) * size;

        const [articles, total] = await Promise.all([
            (this.prisma as any).article.findMany({
                where: {
                    authorId,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    dailyAnalytics: {
                        select: {
                            viewCount: true,
                        },
                    },
                },
                skip,
                take: size,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            (this.prisma as any).article.count({
                where: {
                    authorId,
                    deletedAt: null,
                },
            }),
        ]);

        const formattedArticles = articles.map((article: any) => {
            const totalViews = article.dailyAnalytics.reduce(
                (sum: number, analytics: any) => sum + analytics.viewCount,
                0,
            );
            const { dailyAnalytics, ...rest } = article;
            return {
                ...rest,
                totalViews,
            };
        });

        return {
            data: formattedArticles,
            meta: {
                total,
                page,
                limit: size,
            },
        };
    }
}

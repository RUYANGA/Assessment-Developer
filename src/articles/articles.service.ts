import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticlesService {
    constructor(private prisma: PrismaService) { }

    async create(authorId: string, createArticleDto: CreateArticleDto) {
        return (this.prisma as any).article.create({
            data: {
                ...createArticleDto,
                authorId,
            },
        });
    }

    async findMyArticles(authorId: string, page = 1, size = 10, showDeleted = false) {
        const skip = (page - 1) * size;
        const where: any = {
            authorId,
        };

        if (!showDeleted) {
            where.deletedAt = null;
        }

        const [data, total] = await Promise.all([
            (this.prisma as any).article.findMany({
                where,
                skip,
                take: size,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            (this.prisma as any).article.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit: size,
            },
        };
    }

    async findOne(id: string) {
        const article = await (this.prisma as any).article.findUnique({
            where: { id },
        });

        if (!article) {
            throw new NotFoundException('Article not found');
        }

        return article;
    }

    async update(id: string, authorId: string, updateArticleDto: UpdateArticleDto) {
        const article = await this.findOne(id);

        if (article.authorId !== authorId) {
            throw new ForbiddenException('You can only edit your own articles');
        }

        return (this.prisma as any).article.update({
            where: { id },
            data: updateArticleDto,
        });
    }

    async softDelete(id: string, authorId: string) {
        const article = await this.findOne(id);

        if (article.authorId !== authorId) {
            throw new ForbiddenException('You can only delete your own articles');
        }

        return (this.prisma as any).article.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async findAllPublished(query: { category?: string; author?: string; q?: string }, page = 1, size = 10) {
        const skip = (page - 1) * size;
        const where: any = {
            status: ArticleStatus.PUBLISHED,
            deletedAt: null,
        };

        if (query.category) {
            where.category = query.category;
        }

        if (query.author) {
            where.author = {
                name: {
                    contains: query.author,
                    mode: 'insensitive',
                },
            };
        }

        if (query.q) {
            where.title = {
                contains: query.q,
                mode: 'insensitive',
            };
        }

        const [data, total] = await Promise.all([
            (this.prisma as any).article.findMany({
                where,
                skip,
                take: size,
                include: {
                    author: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            (this.prisma as any).article.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit: size,
            },
        };
    }

    async trackRead(articleId: string, readerId?: string) {
        if (readerId) {
            // Anti-spam: check if the same registered user has read this article in the last 1 minute
            const oneMinuteAgo = new Date(Date.now() - 60000);
            const recentRead = await (this.prisma as any).readLog.findFirst({
                where: {
                    articleId,
                    readerId,
                    readAt: {
                        gte: oneMinuteAgo,
                    },
                },
            });

            if (recentRead) {
                return; // Skip duplicate read log for registered user
            }
        }

        // For guests (no readerId), we always log for now, 
        // or we could implement IP-based tracking if required.
        // The requirement only mentioned capturing ReaderId from JWT if available.

        return (this.prisma as any).readLog.create({
            data: {
                articleId,
                readerId: readerId || null,
            },
        });
    }
}

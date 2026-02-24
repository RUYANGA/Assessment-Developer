import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticlesService {
    // Simple in-memory cache (fallback) to dedupe guest read events (short-lived)
    private guestReadMap = new Map<string, number>();

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

    async trackRead(articleId: string, readerId?: string, guestKey?: string) {
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

        // Guest dedupe: prefer Redis-backed dedupe across instances, fall back to in-memory map
        if (!readerId && guestKey) {
            try {
                // Lazy require to avoid issues when ioredis is not configured in some environments
                const { getRedisClient } = require('../common/redis.client');
                const redis = getRedisClient();
                if (redis) {
                    const redisKey = `guest_read:${articleId}:${guestKey}`;
                    // SET key NX EX 60 -> returns 'OK' when set, null if already exists
                    const setResult = await redis.set(redisKey, '1', 'EX', 60, 'NX');
                    if (setResult === null) {
                        return; // duplicate within TTL
                    }
                } else {
                    // fallback to in-memory dedupe
                    const mapKey = `${articleId}:${guestKey}`;
                    const now = Date.now();
                    const last = this.guestReadMap.get(mapKey) || 0;
                    if (now - last < 60000) {
                        return; // Skip duplicate guest read within 1 minute
                    }
                    this.guestReadMap.set(mapKey, now);
                    setTimeout(() => this.guestReadMap.delete(mapKey), 60000 + 1000);
                }
            } catch (err) {
                // ignore cache errors and continue to log
            }
        }

        return (this.prisma as any).readLog.create({
            data: {
                articleId,
                readerId: readerId || null,
            },
        });
    }
}

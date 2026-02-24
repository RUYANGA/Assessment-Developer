import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ArticlesService', () => {
    let service: ArticlesService;
    let prisma: PrismaService;

    const mockPrismaService = {
        article: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        readLog: {
            findFirst: jest.fn(),
            create: jest.fn(),
        }
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticlesService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ArticlesService>(ArticlesService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an article', async () => {
            const dto = { title: 'T', content: 'C', category: 'Tech' };
            mockPrismaService.article.create.mockResolvedValue({ id: '1', ...dto });

            const result = await service.create('author-1', dto as any);
            expect(result.id).toBe('1');
            expect(mockPrismaService.article.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should throw ForbiddenException if user is not the author', async () => {
            mockPrismaService.article.findUnique.mockResolvedValue({ id: '1', authorId: 'author-2' });

            await expect(service.update('1', 'author-1', {})).rejects.toThrow(ForbiddenException);
        });

        it('should update if user is the author', async () => {
            mockPrismaService.article.findUnique.mockResolvedValue({ id: '1', authorId: 'author-1' });
            mockPrismaService.article.update.mockResolvedValue({ id: '1', title: 'Updated' });

            const result = await service.update('1', 'author-1', { title: 'Updated' });
            expect(result.title).toBe('Updated');
        });
    });

    describe('trackRead', () => {
        it('should skip if recent read exists (anti-spam)', async () => {
            mockPrismaService.readLog.findFirst.mockResolvedValue({ id: 'log-1' });
            const result = await service.trackRead('art-1', 'read-1');
            expect(result).toBeUndefined();
            expect(mockPrismaService.readLog.create).not.toHaveBeenCalled();
        });

        it('should create log if no recent read', async () => {
            mockPrismaService.readLog.findFirst.mockResolvedValue(null);
            mockPrismaService.readLog.create.mockResolvedValue({ id: 'log-2' });

            await service.trackRead('art-1', 'read-1');
            expect(mockPrismaService.readLog.create).toHaveBeenCalled();
        });
    });
});

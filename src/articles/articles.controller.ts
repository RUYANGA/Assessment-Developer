import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    UseGuards,
    Query,
    Req,
    NotFoundException,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('articles')
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    create(@Req() req: any, @Body() createArticleDto: CreateArticleDto) {
        return this.articlesService.create(req.user.userId, createArticleDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    findMyArticles(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('size') size?: string,
        @Query('showDeleted') showDeleted?: string,
    ) {
        return this.articlesService.findMyArticles(
            req.user.userId,
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 10,
            showDeleted === 'true',
        );
    }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('author') author?: string,
        @Query('q') q?: string,
        @Query('page') page?: string,
        @Query('size') size?: string,
    ) {
        return this.articlesService.findAllPublished(
            { category, author, q },
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 10,
        );
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const article = await this.articlesService.findOne(id);

        // Check if deleted
        if (article.deletedAt) {
            throw new NotFoundException('News article no longer available');
        }

        // Track read (Non-blocking)
        const readerId = req.user?.userId;
        this.articlesService.trackRead(id, readerId).catch(err => console.error('Read tracking failed', err));

        return article;
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    update(
        @Param('id') id: string,
        @Req() req: any,
        @Body() updateArticleDto: UpdateArticleDto,
    ) {
        return this.articlesService.update(id, req.user.userId, updateArticleDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    remove(@Param('id') id: string, @Req() req: any) {
        return this.articlesService.softDelete(id, req.user.userId);
    }
}

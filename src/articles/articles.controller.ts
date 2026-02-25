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
import { Role } from '../common/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new article (Authors only)' })
    @ApiResponse({ status: 201, description: 'Article successfully created.' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only authors can create articles.' })
    create(@Req() req: any, @Body() createArticleDto: CreateArticleDto) {
        return this.articlesService.create(req.user.userId, createArticleDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List articles created by the current author' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'size', required: false, type: Number })
    @ApiQuery({ name: 'showDeleted', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Returns paginated list of author articles.' })
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
    @ApiOperation({ summary: 'Public news feed. List all published articles with filters' })
    @ApiQuery({ name: 'category', required: false, type: String })
    @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author name' })
    @ApiQuery({ name: 'q', required: false, type: String, description: 'Search in title' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'size', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Returns paginated list of published articles.' })
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
    @ApiOperation({ summary: 'Get article details and track read' })
    @ApiResponse({ status: 200, description: 'Returns the article details.' })
    @ApiResponse({ status: 404, description: 'Article not found.' })
    async findOne(@Param('id') id: string, @Req() req: any) {
        const article = await this.articlesService.findOne(id);

        // Check if deleted
        if (article.deletedAt) {
            throw new NotFoundException('News article no longer available');
        }

        // Track read (Non-blocking)
        const readerId = req.user?.userId;
        let guestKey: string | undefined;
        if (!readerId) {
            const forwarded = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || '';
            const ua = (req.headers['user-agent'] || '').toString();
            guestKey = `${forwarded}:${ua.substring(0, 80)}`;
        }

        this.articlesService
            .trackRead(id, readerId, guestKey)
            .catch(err => console.error('Read tracking failed', err));

        return article;
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an article (Authors only)' })
    @ApiResponse({ status: 200, description: 'Article successfully updated.' })
    @ApiResponse({ status: 403, description: 'Forbidden. You can only edit your own articles.' })
    @ApiResponse({ status: 404, description: 'Article not found.' })
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
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete an article (Authors only)' })
    @ApiResponse({ status: 200, description: 'Article successfully deleted.' })
    @ApiResponse({ status: 403, description: 'Forbidden. You can only delete your own articles.' })
    @ApiResponse({ status: 404, description: 'Article not found.' })
    remove(@Param('id') id: string, @Req() req: any) {
        return this.articlesService.softDelete(id, req.user.userId);
    }
}

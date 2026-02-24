import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ArticleStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
    @ApiProperty({
        description: 'The title of the article',
        example: 'Introduction to NestJS',
        minLength: 1,
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 150)
    title: string;

    @ApiProperty({
        description: 'The content of the article (min 50 characters)',
        example: 'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
        minLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(50)
    content: string;

    @ApiProperty({
        description: 'The category of the article',
        example: 'Technology',
    })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({
        description: 'The initial status of the article (DRAFT or PUBLISHED). Defaults to DRAFT if omitted.',
        enum: ArticleStatus,
        required: false,
        example: ArticleStatus.DRAFT,
    })
    @IsEnum(ArticleStatus)
    @IsOptional()
    status?: ArticleStatus;
}

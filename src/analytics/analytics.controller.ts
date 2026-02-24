import { Controller, Get, Query, Req, UseGuards, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('author')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        @InjectQueue('analytics') private analyticsQueue: Queue,
    ) { }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    async getDashboard(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('size') size?: string,
    ) {
        return this.analyticsService.getAuthorDashboard(
            req.user.userId,
            page ? parseInt(page) : 1,
            size ? parseInt(size) : 10,
        );
    }

    // Helper endpoint to trigger aggregation manually for testing
    @Post('admin/trigger-aggregation')
    async triggerAggregation() {
        await this.analyticsQueue.add('aggregate-daily', {});
        return { message: 'Aggregation job added to queue' };
    }
}

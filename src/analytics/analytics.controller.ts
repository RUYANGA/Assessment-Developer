import { Controller, Get, Query, Req, UseGuards, Post, Optional } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/role.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('author')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        @Optional() @InjectQueue('analytics') private analyticsQueue?: Queue,
    ) { }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.AUTHOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get aggregated analytics for the current author' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'size', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Returns paginated analytics for articles.' })
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
    @ApiOperation({ summary: 'Manually trigger daily analytics aggregation (Admin/Internal)' })
    @ApiResponse({ status: 201, description: 'Job added to the queue.' })
    async triggerAggregation() {
        if (!this.analyticsQueue) {
            return { message: 'Bull is disabled; aggregation unavailable' };
        }

        await this.analyticsQueue.add('aggregate-daily', {});
        return { message: 'Aggregation job added to queue' };
    }

    // Synchronous aggregation endpoint for testing: runs aggregation immediately and returns result
    @Post('admin/run-aggregation-sync')
    @ApiOperation({ summary: 'Run daily aggregation synchronously (Admin/Internal, testing only)' })
    @ApiResponse({ status: 200, description: 'Aggregation result.' })
    async runAggregationSync() {
        try {
            const count = await this.analyticsService.aggregateDailyStats();
            return { message: 'Aggregation completed', articlesAggregated: count };
        } catch (err) {
            return { message: 'Aggregation failed', error: err?.message || err };
        }
    }
}

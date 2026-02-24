import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './processors/analytics.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'analytics',
        }),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsProcessor],
})
export class AnalyticsModule { }

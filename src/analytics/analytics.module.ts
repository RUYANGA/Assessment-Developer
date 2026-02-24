import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './processors/analytics.processor';

const analyticsImports = [] as any[];
const analyticsProviders = [AnalyticsService] as any[];

if (process.env.DISABLE_BULL !== 'true') {
    analyticsImports.push(
        BullModule.registerQueue({ name: 'analytics' }),
    );
    analyticsProviders.push(AnalyticsProcessor);
}

@Module({
    imports: analyticsImports,
    controllers: [AnalyticsController],
    providers: analyticsProviders,
})
export class AnalyticsModule { }

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from '../analytics.service';

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
    constructor(private analyticsService: AnalyticsService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        if (job.name === 'aggregate-daily') {
            console.log('Processing daily aggregation job...');
            const count = await this.analyticsService.aggregateDailyStats();
            console.log(`Aggregated stats for ${count} articles.`);
            return { count };
        }
    }
}

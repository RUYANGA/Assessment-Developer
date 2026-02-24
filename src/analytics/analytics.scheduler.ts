import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AnalyticsScheduler implements OnModuleInit {
    private readonly logger = new Logger(AnalyticsScheduler.name);

    constructor(@InjectQueue('analytics') private readonly analyticsQueue: Queue) { }

    async onModuleInit() {
        // Register a repeatable job to run daily at 00:05 GMT
        try {
            await this.analyticsQueue.add(
                'aggregate-daily',
                {},
                // Cast to any to avoid typing mismatch across BullMQ versions; include jobId for idempotence
                ({
                    jobId: 'aggregate-daily-job',
                    repeat: {
                        // run daily at 00:05 GMT
                        cron: '5 0 * * *',
                        tz: 'Etc/UTC',
                    },
                    removeOnComplete: true,
                    removeOnFail: true,
                } as any),
            );
            this.logger.log('Registered repeatable job: aggregate-daily (00:05 GMT)');
        } catch (err) {
            this.logger.error('Failed to register repeatable aggregation job', err);
        }
    }
}

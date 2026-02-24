import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(process.env.DISABLE_BULL === 'true'
      ? []
      : [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const redisUrl = configService.get<string>('REDIS_URL');
            if (redisUrl) {
              return { connection: { url: redisUrl } };
            }

            return {
              connection: {
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: configService.get<number>('REDIS_PORT') || 6379,
              },
            };
          },
          inject: [ConfigService],
        }),
      ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

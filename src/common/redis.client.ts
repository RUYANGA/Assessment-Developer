import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

let client: Redis | null = null;

export function getRedisClient(config?: ConfigService) {
    if (client) return client;

    const url = process.env.REDIS_URL || (config && config.get('REDIS_URL'));
    if (url) {
        client = new Redis(url);
    } else {
        const host = process.env.REDIS_HOST || (config && config.get('REDIS_HOST')) || '127.0.0.1';
        const port = Number(process.env.REDIS_PORT || (config && config.get('REDIS_PORT')) || 6379);
        client = new Redis({ host, port });
    }

    client.on('error', (err) => {
        // keep minimal logging here; callers should handle failures
        // console.error('Redis error', err);
    });

    return client;
}

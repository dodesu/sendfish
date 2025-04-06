import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

//Note: ioredis is better - use pub/sub for message waiting (enter id), can use multi websocket server.
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {

        const store = {
          store: await redisStore({
            socket: {
              host: config.get<string>('REDIS_HOST') || '127.0.0.1',
              port: config.get<number>('REDIS_PORT') || 6379
            },
            ttl: config.get<number>('CACHE_TTL') || 300
          })
        }
        return store;
      },
      isGlobal: true,
    }),
    //register end
  ],
})
export class RedisModule { }

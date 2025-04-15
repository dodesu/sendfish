import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
    constructor(@Inject(CACHE_MANAGER) private readonly _cacheManager: Cache) { };

    async get(key: string) {
        return await this._cacheManager.get(key)
    };

    async set(key: string, value: string) {
        return await this._cacheManager.set(key, value);
    }

    async del(key: string) {
        return await this._cacheManager.del(key);
    }
}

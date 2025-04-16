import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatService {
    constructor(private readonly _cacheManager: RedisService) { };

    async isIdValid(id_receive: string): Promise<boolean> {
        if (await this._cacheManager.get('')) {
        }
        return false;
    }
}

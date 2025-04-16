import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.getaway';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, RedisService]
})
export class ChatModule { }

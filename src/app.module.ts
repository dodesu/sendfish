//Root
import { Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//Config
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RedisModule } from './modules/redis/redis.module';

//Sub modules
import { ChatModule } from './modules/chat/chat.module';
//Middlewares


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    RedisModule,
    ChatModule,
  ],

  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    consumer
      .apply()
      .forRoutes();
  }
} 

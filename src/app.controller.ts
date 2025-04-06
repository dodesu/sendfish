import { Controller, Get, Body, Post, Param, Query, Res, Req, Render } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Render('home')
  getHome(@Req() Req: Request) {

    return { isLoadInitJS: Req.signedCookies['cat_id'] === undefined };
  }

  @Get('get')
  async getTest(@Body() body: any, @Query('key') key: string) {
    const text = await this.appService.getKeyRedis(key);
    return text;
  }
  /**
   * 
   * @param publicKey 
   * @param res 
   * @returns 
   */
  @Post('api/init') //TODO: should set token 
  async init(@Body() publicKey: string, @Res() Res: Response) {
    const cat_id = await this.appService.savePublicKey(publicKey);
    Res.cookie('cat_id', cat_id, {
      httpOnly: true,
      maxAge: 60 * 60 * 5 * 1000, //5h 
      signed: true,
    });
    console.log(`Cat id = ${cat_id}`);
    return Res.json({ cat_id });
  }

}

import { Controller, Get, Body, Post, Param, Query, Res, Req, Render } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Render('home')
  async getHome(@Req() Req: Request) { }

  @Get('api/id')
  async getId(@Req() Req: Request, @Res() Res: Response) {
    const cat_id = Req.signedCookies['cat_id'];
    // Check cookie cat_id 
    if (cat_id == undefined) {
      return Res.json({ hasInit: false });
    }
    // Check redis cat_id
    const is_expired = await this.appService.isExpired(cat_id);
    if (is_expired) {
      return Res.json({ hasInit: false }); //expired redis = no data 
    }
    return Res.json({ hasInit: true, catId: cat_id });

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
  async init(@Body() data: { publicKey: string }, @Res() Res: Response) {
    const cat_id = await this.appService.savePublicKey(data.publicKey);
    Res.cookie('cat_id', cat_id, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, //1h
      signed: true, //if other domain, set to false
    });
    return Res.json({ cat_id });
  }

}

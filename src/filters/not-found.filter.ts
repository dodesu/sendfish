import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

@Catch(NotFoundException)
export class NotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    console.log('Check');
    const response = host.switchToHttp().getResponse<Response>();
    // Chuyển hướng người dùng về trang chủ
    response.status(404).redirect('/');
  }
}

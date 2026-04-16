import { Controller, Post, Body, Version, HttpCode } from '@nestjs/common';
import { Public } from '@/core/decorators/public.decorator';

@Controller({ path: 'auth' })
@Public()
export class AuthController {
  @Post('login')
  @Version('1')
  @HttpCode(501)
  async login(@Body() body: { email: string; password: string }) {
    return {
      statusCode: 501,
      message: 'Not implemented',
      error: 'Authentication is not yet implemented',
    };
  }
}

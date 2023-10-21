import { Body, Controller, Post, Res } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { SigninDto } from './dtos/signin.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { UserResponse } from '../responses/user-response.type';
@Controller('/api/users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(
    @Body('user') loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const user = await this.authService.login(loginDto);
    const token = await this.authService.generateJwt(user);
    response.setHeader('Authorization', 'Token ' + token);
    response.setHeader('Content-Type', 'application/json;charset=utf-8');
    return {
      user: {
        username: user.username,
        email: user.email,
        token,
        image: user.image,
        bio: user.bio,
      },
    };
  }

  @Post('')
  async signin(
    @Body('user') signinDto: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const user = await this.authService.signin(signinDto);
    const token = await this.authService.generateJwt(user);
    response.setHeader('Authorization', 'Token ' + token);
    response.setHeader('Content-Type', 'application/json;charset=utf-8');
    return {
      user: {
        username: user.username,
        email: user.email,
        token,
        image: user.image,
        bio: user.bio,
      },
    };
  }
}

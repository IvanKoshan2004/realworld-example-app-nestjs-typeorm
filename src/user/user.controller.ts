import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../helpers/decorators/current-user.decorator';
import { UserJwt } from '../auth/types/user-jwt.type';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponse } from '../responses/user-response.type';
import { Request } from 'express';

@Controller('/api/user')
export class UserController {
  constructor(private userService: UserService) {}
  @Put('')
  @UseGuards(AuthGuard)
  async updateUser(
    @Body('user') updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserJwt,
    @Req() request: Request,
  ): Promise<UserResponse> {
    const userEntity = await this.userService.updateUser(
      updateUserDto,
      user.id,
      user.signId,
    );
    let token: string;
    if (updateUserDto.password) {
      token = await this.userService.generateNewJwt(userEntity);
    } else {
      token = request.headers.authorization.split(' ')[1];
    }
    return {
      user: {
        username: userEntity.username,
        email: userEntity.email,
        bio: userEntity.bio,
        image: userEntity.image,
        token: token,
      },
    };
  }

  @Get('')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @CurrentUser() user: UserJwt,
    @Req() request: Request,
  ): Promise<UserResponse> {
    const currentUser = await this.userService.getUser(user.id);
    const token = request.headers.authorization.split(' ')[1];
    return { user: { ...currentUser.user, token: token } };
  }
}

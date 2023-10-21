import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserResponseNoToken } from '../responses/user-response.type';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}
  async updateUser(
    updateUserDto: UpdateUserDto,
    userId: number,
    signId: string,
  ): Promise<UserEntity> {
    return await this.authService.updateUser(updateUserDto, userId, signId);
  }
  async generateNewJwt(user: UserEntity): Promise<string> {
    return this.authService.generateJwt(user);
  }
  async getUser(userId: number): Promise<UserResponseNoToken> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      return { user: null };
    }
    return {
      user: {
        username: user.username,
        bio: user.bio,
        email: user.email,
        image: user.image,
      },
    };
  }
}

import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../helpers/decorators/current-user.decorator';
import { UserJwt } from '../auth/types/user-jwt.type';
import { ProfileResponse } from '../responses/profile-responses.type';
import { ExtractUserGuard } from '../auth/guards/extract-user.guard';

@Controller('/api/profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}
  @Get('/:username')
  @UseGuards(ExtractUserGuard)
  async getUserProfile(
    @Param('username') username: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ProfileResponse> {
    let currentUserId = -1;
    if (user) {
      currentUserId = user.id;
    }
    const profile = await this.profileService.getProfileByUsername(
      currentUserId,
      username,
    );
    return profile;
  }

  @Post('/:username/follow')
  @UseGuards(AuthGuard)
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ProfileResponse> {
    const profile = await this.profileService.followUser(username, user.id);
    return profile;
  }

  @Delete('/:username/follow')
  @UseGuards(AuthGuard)
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ProfileResponse> {
    const profile = await this.profileService.unfollowUser(username, user.id);
    return profile;
  }
}

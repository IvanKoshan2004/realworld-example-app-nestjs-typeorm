import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  ProfileResponse,
  ProfileResponseObject,
} from '../responses/profile-responses.type';
import { FollowsEntity } from '../user/entities/follows.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(FollowsEntity)
    private followsRepository: Repository<FollowsEntity>,
  ) {}
  async getProfileByUsername(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponse> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where({ username: username })
      .leftJoin('user.follows', 'follows')
      .addSelect(
        'CASE WHEN MAX(:currentUserId = follows.follower_id) = 1 THEN true ELSE false END',
        'user_followingTinyInt',
      )
      .setParameters({ currentUserId })
      .getOne();
    if (!user.username) {
      return { profile: null };
    }
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: user.followingTinyInt == 1,
      },
    };
  }
  async getProfileById(
    currentUserId: number,
    id: number,
  ): Promise<ProfileResponse> {
    const q = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.bio', 'user.image'])
      .where({ id: id })
      .leftJoin('user.follows', 'follows')
      .addSelect(
        'MAX(:currentUserId = follows.follower_id)',
        'user_followingTinyInt',
      )
      .groupBy('user.id')
      .setParameters({ currentUserId });
    const rawUser = await q.getRawOne();
    if (!rawUser['user_username']) {
      return { profile: null };
    }
    return {
      profile: {
        username: rawUser['user_username'],
        bio: rawUser['user_bio'],
        image: rawUser['user_image'],
        following: rawUser['user_followingTinyInt'] == 1,
      },
    };
    // if (!user.username) {
    //   return { profile: null };
    // }
    // const user = await q.getOne();
    // TypeORM doesn't map the followingTinyInt from the getOne
    // return {
    //   profile: {
    //     username: user.username,
    //     bio: user.bio,
    //     image: user.image,
    //     following: user.followingTinyInt == 1,
    //   },
    // };
  }
  async getProfilesByIds(
    currentUserId: number,
    ids: number[],
  ): Promise<(ProfileResponseObject & { id: number })[]> {
    if (ids.length == 0) {
      return [];
    }
    const q = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.bio', 'user.image'])
      .where('user.id IN (:...ids)', { ids })
      .leftJoinAndSelect('user.follows', 'follows')
      .addSelect(
        'MAX(:currentUserId = follows.follower_id)',
        'user_followingTinyInt',
      )
      .groupBy('user.id')
      .setParameters({ currentUserId });
    const rawUsers = await q.getRawMany();
    const profiles = rawUsers.map((rawUser) => ({
      id: rawUser['user_id'],
      username: rawUser['user_username'],
      bio: rawUser['user_bio'],
      image: rawUser['user_image'],
      following: rawUser['user_followingTinyInt'] == 1,
    }));
    // TypeORM doesn't map the followingTinyInt from the getMany
    // const users = await q.getMany();
    // const profiles = users.map((user) => ({
    //   id: user.id,
    //   username: user.username,
    //   bio: user.bio,
    //   image: user.image,
    //   following: user.followingTinyInt == 1,
    // }));
    return profiles;
  }
  async followUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const user = await this.usersRepository.findOneByOrFail({
      username: username,
    });
    await this.followsRepository.save([
      { follower_id: currentUserId, follows_id: user.id },
    ]);
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: true,
      },
    };
  }
  async unfollowUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponse> {
    const user = await this.usersRepository.findOneByOrFail({
      username: username,
    });
    await this.followsRepository
      .createQueryBuilder('follows')
      .delete()
      .from(FollowsEntity)
      .where('follows_id = :followsUserId and follower_id = :followerUserId', {
        followsUserId: user.id,
        followerUserId: currentUserId,
      })
      .execute();
    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: false,
      },
    };
  }
}

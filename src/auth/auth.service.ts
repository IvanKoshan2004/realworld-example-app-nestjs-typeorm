import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity, UserHashAlgorithm } from '../user/entities/user.entity';
import { DeepPartial, QueryFailedError, Repository } from 'typeorm';
import { SigninDto } from './dtos/signin.dto';
import { LoginDto } from './dtos/login.dto';
import * as crypto from 'crypto';
import { UserJwt } from './types/user-jwt.type';
import { UpdateUserDto } from '../user/dtos/update-user.dto';
import { ValidatedJwtService } from '../validated-jwt/validated-jwt.service';

@Injectable()
export class AuthService {
  private hashIterations = 100000;
  private hashAlgorithm: UserHashAlgorithm = 'sha512';
  private hashLength = 64;

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: ValidatedJwtService,
  ) {}

  async signin(signinDto: SigninDto): Promise<UserEntity> {
    const salt = crypto.randomBytes(32);
    const hash = await this.generateHash(signinDto.password, salt);
    const userData: DeepPartial<UserEntity> = {
      ...signinDto,
      salt: salt,
      hash: hash,
      hash_algorithm: this.hashAlgorithm,
      hash_iterations: this.hashIterations,
    };
    try {
      const user = await this.usersRepository.save(userData);
      return user;
    } catch (e) {
      console.log(e);
      throw new BadRequestException({
        error: 'This username or email, already exists',
      });
    }
  }
  async login(loginDto: LoginDto): Promise<UserEntity> {
    const userEntity = await this.usersRepository.findOneBy({
      email: loginDto.email,
    });
    if (!userEntity) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }
    const algorithm = userEntity.hash_algorithm;
    const iterations = userEntity.hash_iterations;
    const length = userEntity.hash.length;

    const loginHash = await this.generateHash(
      loginDto.password,
      userEntity.salt,
      {
        algorithm,
        iterations,
        length,
      },
    );

    const isAuthorized = Buffer.compare(loginHash, userEntity.hash) === 0;
    if (!isAuthorized) {
      throw new UnauthorizedException({ error: 'Unauthorized' });
    }
    return userEntity;
  }
  async updateUser(
    updateUserDto: UpdateUserDto,
    userId: number,
    signId: string,
  ): Promise<UserEntity> {
    let updateUserData: DeepPartial<UserEntity> = {
      id: userId,
      email: updateUserDto.email,
      username: updateUserDto.username,
      image: updateUserDto.image,
      bio: updateUserDto.bio,
    };
    if (updateUserDto.password) {
      const salt = crypto.randomBytes(32);
      const hash = await this.generateHash(updateUserDto.password, salt);
      const loginData: DeepPartial<UserEntity> = {
        salt: salt,
        hash: hash,
        hash_algorithm: this.hashAlgorithm,
        hash_iterations: this.hashIterations,
      };
      await this.invalidateJwt(signId);
      updateUserData = { ...updateUserData, ...loginData };
    }
    try {
      const user = await this.usersRepository.save(updateUserData);
      return this.usersRepository.findOneBy({ id: user.id });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError)
        throw new BadRequestException({
          errors: { message: 'Either username or email is already used' },
        });
    }
  }
  async generateJwt(user: UserEntity): Promise<string> {
    const tokenPayload: UserJwt = {
      id: user.id,
      username: user.username,
    };
    const signedToken = await this.jwtService.signAsync(tokenPayload);
    return signedToken;
  }

  private async generateHash(
    password: string,
    salt: Buffer,
    options?: {
      algorithm: UserHashAlgorithm;
      iterations: number;
      length: number;
    },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let iterations = this.hashIterations;
      let length = this.hashLength;
      let algorithm = this.hashAlgorithm;
      if (options) {
        algorithm = options.algorithm;
        iterations = options.iterations;
        length = options.length;
      }
      const passwordBuffer = Buffer.from(password, 'utf8');
      crypto.pbkdf2(
        passwordBuffer,
        salt,
        iterations,
        length,
        algorithm,
        (err, buffer) => {
          if (err) reject(err);
          resolve(buffer);
        },
      );
    });
  }
  private async invalidateJwt(signId: string): Promise<void> {
    return this.jwtService.invalidate(signId);
  }
}

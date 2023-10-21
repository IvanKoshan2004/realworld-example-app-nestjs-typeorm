import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { ValidatedJwtModule } from '../validated-jwt/validated-jwt.module';
import { ValidatedJwtService } from '../validated-jwt/validated-jwt.service';
import { ValidJwtEntity } from '../validated-jwt/entity/valid-jwt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ValidJwtEntity]),
    ValidatedJwtModule,
  ],
  controllers: [AuthController],
  //useExisting for jwtService, for it to registed the config from registered module
  providers: [AuthService, ValidatedJwtService],
  exports: [AuthService, ValidatedJwtService],
})
export class AuthModule {}

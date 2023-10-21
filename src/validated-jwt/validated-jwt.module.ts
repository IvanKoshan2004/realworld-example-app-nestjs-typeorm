import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ValidatedJwtService } from './validated-jwt.service';
import * as path from 'path';
import jwtConfig from '../config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidJwtEntity } from './entity/valid-jwt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValidJwtEntity]),
    JwtModule.registerAsync({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
          envFilePath: [path.resolve(__dirname, '../../env/.jwt.env')],
        }),
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('jwt.secret'),
        };
      },
    }),
  ],
  //useExisting for jwtService, for it to registed the config from registered module
  providers: [
    ValidatedJwtService,
    { provide: 'JwtService', useExisting: JwtService },
  ],
  exports: [
    ValidatedJwtService,
    { provide: 'JwtService', useExisting: JwtService },
  ],
})
export class ValidatedJwtModule {}

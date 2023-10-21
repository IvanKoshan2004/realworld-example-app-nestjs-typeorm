import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { ArticleModule } from './article/article.module';
import { TagsModule } from './tags/tags.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeOrmConfig from './config/typeorm.config';
import * as path from 'path';
import { UserEntity } from './user/entities/user.entity';
import { ArticleEntity } from './article/entities/article.entity';
import { CommentEntity } from './article/entities/comment.entity';
import { TagEntity } from './tags/entities/tag.entity';
import { FavoriteArticleEntity } from './article/entities/favorite-article.entity';
import { FollowsEntity } from './user/entities/follows.entity';
import { ValidatedJwtModule } from './validated-jwt/validated-jwt.module';
import { ValidJwtEntity } from './validated-jwt/entity/valid-jwt.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.resolve(__dirname, '../env/.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [path.resolve(__dirname, '../env/.database.env')],
          load: [typeOrmConfig],
        }),
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.name'),
          entities: [
            UserEntity,
            ArticleEntity,
            CommentEntity,
            TagEntity,
            FavoriteArticleEntity,
            FollowsEntity,
            ValidJwtEntity,
          ],
          synchronize: true,
          // logging: true,
        };
      },
    }),
    UserModule,
    ProfileModule,
    ArticleModule,
    TagsModule,
    AuthModule,
    ValidatedJwtModule,
  ],
})
export class AppModule {}

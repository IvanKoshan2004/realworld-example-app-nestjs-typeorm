import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleEntity } from './entities/article.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CommentEntity } from './entities/comment.entity';
import { ArticleController } from './article.controller';
import { ProfileModule } from '../profile/profile.module';
import { FavoriteArticleEntity } from './entities/favorite-article.entity';
import { UserEntity } from '../user/entities/user.entity';
import { TagEntity } from '../tags/entities/tag.entity';

@Module({
  imports: [
    ProfileModule,
    TypeOrmModule.forFeature([
      ArticleEntity,
      UserEntity,
      CommentEntity,
      FavoriteArticleEntity,
      TagEntity,
    ]),
    AuthModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}

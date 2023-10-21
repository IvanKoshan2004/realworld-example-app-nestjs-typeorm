import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetArticlesQueryDto } from './dtos/get-articles-query.dto';
import { GetFeedQueryDto } from './dtos/get-feed-query.dto';
import { CreateArticleDto } from './dtos/create-article.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
import { AddCommentDto } from './dtos/add-comment.dto';
import { ArticleService } from './article.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../helpers/decorators/current-user.decorator';
import { UserJwt } from '../auth/types/user-jwt.type';
import { ExtractUserGuard } from '../auth/guards/extract-user.guard';

import {
  ArticleResponse,
  ArticlesResponse,
} from '../responses/article-responses.type';
import {
  CommentResponse,
  CommentsResponse,
} from '../responses/comment-responses.type';

@Controller('/api/articles')
export class ArticleController {
  constructor(private articleService: ArticleService) {}
  @Post()
  @UseGuards(AuthGuard)
  createArticle(
    @Body('article') createArticleDto: CreateArticleDto,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticleResponse> {
    return this.articleService.createArticle(createArticleDto, user.id);
  }
  // To DO
  @Get()
  @UseGuards(ExtractUserGuard)
  getArticles(
    @Query() getArticlesQueryDto: GetArticlesQueryDto,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticlesResponse> {
    const currentUserId = user ? user.id : -1;
    return this.articleService.getArticles(getArticlesQueryDto, currentUserId);
  }

  @Get('/feed')
  @UseGuards(AuthGuard)
  getFeed(
    @Query() getFeedQueryDto: GetFeedQueryDto,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticlesResponse> {
    return this.articleService.getFeed(getFeedQueryDto, user.id);
  }

  @Get('/:slug')
  @UseGuards(ExtractUserGuard)
  getArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticleResponse> {
    const currentUserId = user ? user.id : -1;
    return this.articleService.getArticle(slug, currentUserId);
  }

  @Put('/:slug')
  @UseGuards(AuthGuard)
  updateArticle(
    @Param('slug') slug: string,
    @Body('article') updateArticleDto: UpdateArticleDto,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticleResponse> {
    return this.articleService.updateArticle(slug, updateArticleDto, user.id);
  }

  @Delete('/:slug')
  @UseGuards(AuthGuard)
  deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserJwt,
  ): Promise<void> {
    return this.articleService.deleteArticle(slug, user.id);
  }

  @Post('/:slug/comments')
  @UseGuards(AuthGuard)
  addComment(
    @Param('slug') slug: string,
    @Body('comment') addCommentDto: AddCommentDto,
    @CurrentUser() user: UserJwt,
  ): Promise<CommentResponse> {
    return this.articleService.addComment(slug, addCommentDto, user.id);
  }

  @Get('/:slug/comments')
  @UseGuards(ExtractUserGuard)
  getComments(
    @Param('slug') slug: string,
    @CurrentUser() user: UserJwt,
  ): Promise<CommentsResponse> {
    const currentUserId = user ? user.id : -1;
    return this.articleService.getComments(slug, currentUserId);
  }

  @Delete('/:slug/comments/:id')
  @UseGuards(AuthGuard)
  deleteComment(
    // @Param('slug') slug: string,
    @Param('id') commentId: number,
    @CurrentUser() user: UserJwt,
  ): Promise<void> {
    return this.articleService.deleteComment(commentId, user.id);
  }

  @Post('/:slug/favorite')
  @UseGuards(AuthGuard)
  favoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticleResponse> {
    return this.articleService.favoriteArticle(slug, user.id);
  }

  @Delete('/:slug/favorite')
  @UseGuards(AuthGuard)
  unfavoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: UserJwt,
  ): Promise<ArticleResponse> {
    return this.articleService.unfavoriteArticle(slug, user.id);
  }
}

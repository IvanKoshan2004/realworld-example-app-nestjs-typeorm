import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from './entities/article.entity';
import { DeepPartial, EntityNotFoundError, Repository } from 'typeorm';
import { CreateArticleDto } from './dtos/create-article.dto';
import { GetArticlesQueryDto } from './dtos/get-articles-query.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
import { CommentEntity } from './entities/comment.entity';
import { UserEntity } from '../user/entities/user.entity';
import { ProfileService } from '../profile/profile.service';
import {
  ArticleResponse,
  ArticleResponseObject,
  ArticlesResponse,
} from '../responses/article-responses.type';
import {
  CommentResponse,
  CommentResponseObject,
  CommentsResponse,
} from '../responses/comment-responses.type';
import { AddCommentDto } from './dtos/add-comment.dto';
import { ProfileResponseObject } from '../responses/profile-responses.type';
import { randomBytes } from 'crypto';
import { FavoriteArticleEntity } from './entities/favorite-article.entity';
import { GetFeedQueryDto } from './dtos/get-feed-query.dto';
import { TagEntity } from '../tags/entities/tag.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private articlesRepository: Repository<ArticleEntity>,
    @InjectRepository(FavoriteArticleEntity)
    private farovitesRepository: Repository<FavoriteArticleEntity>,
    @InjectRepository(TagEntity)
    private tagsRepository: Repository<TagEntity>,
    @InjectRepository(CommentEntity)
    private commentsRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private profileService: ProfileService,
  ) {}
  async createArticle(
    createArticleDto: CreateArticleDto,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const createdAt = new Date();
    const slug = this.generateSlug(createArticleDto.title);
    const articleData: DeepPartial<ArticleEntity> = {
      ...createArticleDto,
      slug,
      createdAt,
      updatedAt: createdAt,
      author: { id: currentUserId },
    };
    const savedArticle = await this.articlesRepository.save(articleData);
    const tags = await this.tagsRepository.save(
      createArticleDto.tagList.map((tag) => {
        return { title: tag };
      }),
    );
    await this.articlesRepository.save([{ id: savedArticle.id, tags: tags }]);
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .where({ slug: savedArticle.slug })
      .leftJoinAndSelect('article.favoritedBy', 'favorites')
      .leftJoinAndSelect('article.author', 'author')
      .addSelect('0', 'article_favoritesCount')
      .addSelect('0', 'article_favoritedTinyIntBool')
      .leftJoinAndSelect('article.tags', 'tags')
      .getOne();
    const authorProfile = await this.profileService.getProfileById(
      currentUserId,
      article.author.id,
    );
    return {
      article: this.mapArticleEntityAndProfileToResponseObject(
        article,
        authorProfile.profile,
      ),
    };
  }
  async getArticle(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .where({ slug })
      .leftJoin('article.favoritedBy', 'favorites')
      .leftJoin('article.author', 'author')
      .leftJoin('article.tags', 'tags')
      .leftJoin('author.follows', 'follows')
      .addSelect(['tags.title', 'author.id'])
      .addSelect('COUNT(DISTINCT favorites.user_id)', 'article_favoritesCount')
      .addSelect(
        `MAX(:currentUserId = favorites.user_id)`,
        'article_favoritedTinyIntBool',
      )
      .groupBy('article.id, tags.id')
      .setParameters({ currentUserId })
      .getOneOrFail();

    const authorProfile = await this.profileService.getProfileById(
      currentUserId,
      article.author.id,
    );
    if (!article) {
      throw new NotFoundException({ error: 'Article not found' });
    }
    return {
      article: this.mapArticleEntityAndProfileToResponseObject(
        article,
        authorProfile.profile,
      ),
    };
  }
  async getArticles(
    getArticlesQueryDto: GetArticlesQueryDto,
    currentUserId: number,
  ): Promise<ArticlesResponse> {
    let qb = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.favoritedBy', 'favorites')
      .leftJoin('article.author', 'author')
      .addSelect('author.id')
      .addSelect('COUNT(DISTINCT favorites.user_id)', 'article_favoritesCount')
      .groupBy('article.id')
      .orderBy('article.createdAt', 'DESC');

    if (getArticlesQueryDto.author) {
      qb = qb.andWhere('author.username = :author', {
        author: getArticlesQueryDto.author,
      });
    }
    if (getArticlesQueryDto.favorited) {
      const favoritedUser = await this.usersRepository.findOneByOrFail({
        username: getArticlesQueryDto.favorited,
      });
      qb = qb
        .addSelect(
          `MAX(:favoritedUserId = favorites.user_id)`,
          'article_favoritedTinyIntBool',
        )
        .setParameters({ favoritedUserId: favoritedUser.id })
        .andHaving('article_favoritedTinyIntBool = 1');
    } else {
      qb = qb
        .addSelect(
          `MAX(:currentUserId = favorites.user_id)`,
          'article_favoritedTinyIntBool',
        )
        .setParameters({ currentUserId });
    }
    if (getArticlesQueryDto.tag) {
      qb = qb.andWhere(
        'article.id IN (SELECT at.article_id FROM tag t1 LEFT JOIN article_tag at ON at.tag_id = t1.id WHERE t1.title = :tag)',
        { tag: getArticlesQueryDto.tag },
      );
    }
    const queryResult = await qb.getMany();
    const articles = queryResult.slice(
      getArticlesQueryDto.offset,
      getArticlesQueryDto.offset + getArticlesQueryDto.limit,
    );
    if (articles.length == 0) {
      return {
        articles: [],
        articlesCount: 0,
      };
    }
    const articleIds = [...new Set(articles.map((article) => article.id))];
    const articlesWithTags = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .leftJoin('article.tags', 'tags')
      .addSelect(['tags.title', 'author.id'])
      .where('article.id in (:...articleIds)', { articleIds })
      .getMany();

    const authorProfilesIds = [
      ...new Set(articles.map((article) => article.author.id)),
    ];
    const authorProfiles = await this.profileService.getProfilesByIds(
      currentUserId,
      authorProfilesIds,
    );
    const articleResponses = articlesWithTags.map((article) =>
      this.mapArticleEntityAndProfileToResponseObject(
        article,
        authorProfiles.find((el) => el.id == article.author.id),
      ),
    );
    return {
      articles: articleResponses,
      articlesCount: articleResponses.length,
    };
  }
  async getFeed(
    getFeedQueryDto: GetFeedQueryDto,
    currentUserId: number,
  ): Promise<ArticlesResponse> {
    const qb = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.favoritedBy', 'favorites')
      .leftJoin('article.author', 'author')
      .addSelect(['author.id', 'author.username', 'favorites.user_id'])
      .addSelect('COUNT(DISTINCT favorites.user_id)', 'article_favoritesCount')
      .where(
        `author.id IN (SELECT follows.follows_id FROM follows follows WHERE follows.follower_id = :currentUserId)`,
        { currentUserId },
      )
      .groupBy('article.id')
      .orderBy('article.createdAt', 'DESC');
    const queryResult = await qb.getMany();
    const articles = queryResult.slice(
      getFeedQueryDto.offset,
      getFeedQueryDto.offset + getFeedQueryDto.limit,
    );

    if (articles.length == 0) {
      return {
        articles: [],
        articlesCount: 0,
      };
    }
    const articleIds = [...new Set(articles.map((article) => article.id))];
    const articlesWithTags = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .leftJoin('article.tags', 'tags')
      .addSelect(['tags.title', 'author.id'])
      .where('article.id in (:...articleIds)', { articleIds })
      .getMany();

    const authorProfilesIds = [
      ...new Set(articles.map((article) => article.author.id)),
    ];
    const authorProfiles = await this.profileService.getProfilesByIds(
      currentUserId,
      authorProfilesIds,
    );
    const articleResponses = articlesWithTags.map((article) =>
      this.mapArticleEntityAndProfileToResponseObject(
        article,
        authorProfiles.find((el) => el.id == article.author.id),
      ),
    );
    return {
      articles: articleResponses,
      articlesCount: articleResponses.length,
    };
  }
  async updateArticle(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .addSelect('author.id')
      .where('article.slug = :slug', { slug })
      .getOneOrFail();

    if (article.author.id != currentUserId) {
      throw new UnauthorizedException('User is unauthorized');
    }
    let updateArticleData: DeepPartial<ArticleEntity> = {
      id: article.id,
      updatedAt: new Date(),
      ...updateArticleDto,
    };
    if (updateArticleDto.title) {
      const newSlug = this.generateSlug(updateArticleDto.title);
      updateArticleData = {
        ...updateArticleData,
        slug: newSlug,
        title: updateArticleDto.title,
      };
    }
    await this.articlesRepository.save(updateArticleData);
    return this.getArticle(
      updateArticleData.slug ? updateArticleData.slug : slug,
      currentUserId,
    );
  }
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .addSelect('author.id')
      .where('article.slug = :slug', { slug: slug })
      .getOne();
    if (!article) {
      throw new EntityNotFoundError(ArticleEntity, 'slug');
    }
    if (article.author.id != currentUserId) {
      throw new UnauthorizedException('Article delete by unauthorized user');
    }
    await this.articlesRepository.delete({ id: article.id });
  }
  async addComment(
    slug: string,
    addCommentDto: AddCommentDto,
    currentUserId: number,
  ): Promise<CommentResponse> {
    const article = await this.articlesRepository.findOneByOrFail({
      slug: slug,
    });
    const createdAt = new Date();
    const commentData: DeepPartial<CommentEntity> = {
      createdAt,
      updatedAt: createdAt,
      body: addCommentDto.body,
      article: { id: article.id },
      author: { id: currentUserId },
    };
    const comment = await this.commentsRepository.save(commentData);
    const authorProfile = await this.profileService.getProfileById(
      currentUserId,
      comment.author.id,
    );
    return {
      comment: this.mapCommentEntityAndProfileToResponseObject(
        comment,
        authorProfile.profile,
      ),
    };
  }
  async getComments(
    slug: string,
    currentUserId: number,
  ): Promise<CommentsResponse> {
    await this.articlesRepository.findOneOrFail({ where: { slug: slug } });
    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .leftJoin('comment.article', 'article')
      .addSelect('author.id')
      .where('article.slug = :slug', { slug: slug })
      .getMany();
    const authorProfileIds = [
      ...new Set(comments.map((comment) => comment.author.id)),
    ];
    const authorProfiles = await this.profileService.getProfilesByIds(
      currentUserId,
      authorProfileIds,
    );
    const commentResponses = comments.map((comment) =>
      this.mapCommentEntityAndProfileToResponseObject(
        comment,
        authorProfiles.find((el) => el.id == comment.author.id),
      ),
    );
    return {
      comments: commentResponses,
    };
  }
  async deleteComment(
    slug: string,
    commentId: number,
    currentUserId: number,
  ): Promise<void> {
    await this.articlesRepository.findOneByOrFail({
      slug: slug,
    });
    const comment = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .addSelect('author.id')
      .where('comment.id = :commentId', { commentId: commentId })
      .getOne();
    if (!comment) {
      throw new EntityNotFoundError(CommentEntity, 'id');
    }
    if (comment.author.id != currentUserId) {
      throw new UnauthorizedException('Comment delete by unauthorized user');
    }
    await this.commentsRepository.delete({
      id: commentId,
    });
    return;
  }
  async favoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const article = await this.articlesRepository.findOneByOrFail({
      slug: slug,
    });
    await this.farovitesRepository.save({
      article_id: article.id,
      user_id: currentUserId,
    });
    const favoritedArticle = await this.getArticle(slug, currentUserId);
    return favoritedArticle;
  }
  async unfavoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const article = await this.articlesRepository.findOneByOrFail({
      slug: slug,
    });
    await this.farovitesRepository.delete({
      article_id: article.id,
      user_id: currentUserId,
    });
    const favoritedArticle = await this.getArticle(slug, currentUserId);
    return favoritedArticle;
  }
  private mapArticleEntityAndProfileToResponseObject(
    article: ArticleEntity,
    author: ProfileResponseObject,
  ): ArticleResponseObject {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((tag) => tag.title),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favoritedTinyIntBool == 1,
      favoritesCount: article.favoritesCount,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
  }
  private mapCommentEntityAndProfileToResponseObject(
    comment: CommentEntity,
    author: ProfileResponseObject,
  ): CommentResponseObject {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: author.following,
      },
    };
  }
  private generateSlug(title: string) {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .join('-') +
      '-' +
      randomBytes(3).toString('base64url');
    return slug;
  }
}

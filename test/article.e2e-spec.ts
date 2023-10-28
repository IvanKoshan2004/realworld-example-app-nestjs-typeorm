import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateArticleDto } from '../src/article/dtos/create-article.dto';
import { UpdateArticleDto } from '../src/article/dtos/update-article.dto';
import {
  ArticleResponseObject,
  ArticlesResponse,
} from '../src/responses/article-responses.type';
import { randomBytes } from 'crypto';
import { LoginDto } from '../src/auth/dtos/login.dto';
import { SigninDto } from '../src/auth/dtos/signin.dto';
import { CommentResponseObject } from '../src/responses/comment-responses.type';
import { bootstrap } from '../src/app-bootstrap';

describe('Article testing', () => {
  let app: INestApplication;
  let server: any;
  const existingPrefix = randomBytes(6).toString('base64url');
  const existingUser1 = {
    user: {
      email: existingPrefix + 'email@gmail.com',
      password: 'password',
      username: existingPrefix + 'username',
    },
  };
  const existingUser2 = {
    user: {
      email: existingPrefix + 'email2@gmail.com',
      password: 'password',
      username: existingPrefix + 'username2',
    },
  };
  const existingArticle = {
    article: {
      body: 'Article body',
      description: 'Article description',
      tagList: ['React', 'Typescript'],
      title: 'title',
    } as CreateArticleDto,
  };
  async function login(user: { user: LoginDto }): Promise<string> {
    const res = await request(server).post('/api/users/login').send(user);
    return res.headers.authorization;
  }
  async function signin(user: { user: SigninDto }): Promise<string> {
    const res = await request(server).post('/api/users').send(user);
    return res.headers.authorization;
  }
  function generateCreateArticleDto(): { article: CreateArticleDto } {
    const suffix = randomBytes(5).toString('base64');
    return {
      article: {
        body: 'Article body ' + suffix,
        description: 'Article description' + suffix,
        tagList: ['React', 'Typescript'],
        title: 'title' + suffix,
      } as CreateArticleDto,
    };
  }
  async function createArticleRequest(
    article: { article: CreateArticleDto },
    authorization: string,
  ): Promise<request.Response> {
    const res = await request(server)
      .post('/api/articles')
      .set('Authorization', authorization)
      .send(article);
    return res;
  }
  let existingArticleSlug: string;

  beforeAll(async () => {
    app = await bootstrap();
    await app.init();
    server = app.getHttpServer();
    await signin(existingUser2);
    const authorization = await signin(existingUser1);
    const res = await createArticleRequest(existingArticle, authorization);
    existingArticleSlug = res.body.article.slug;
  });

  describe.only('[ENDPOINT]: /api/articles/:slug', () => {
    const updateArticleDto = {
      article: {
        body: 'new_body',
        description: 'new_description',
        title: 'new_title',
      } as UpdateArticleDto,
    };
    it('GET should return an article if exists, with attributes set on the setup', async () => {
      const res = await request(server).get(
        `/api/articles/${existingArticleSlug}`,
      );
      const article = res.body.article as ArticleResponseObject;
      expect(res.statusCode).toEqual(200);
      expect(article.body).toEqual(existingArticle.article.body);
      expect(article.description).toEqual(existingArticle.article.description);
      expect(article.title).toEqual(existingArticle.article.title);
      expect(article.tagList).toContain('React');
      expect(article.tagList).toContain('Typescript');
    });
    it('GET should return an article with favorited property set to true, if it was favorited previously', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res = await createArticleRequest(newArticle, authorization);
      const articleRes = res.body.article as ArticleResponseObject;
      const slug = articleRes.slug;
      await request(server)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', authorization);
      const res2 = await request(server).get(`/api/articles/${slug}`);
      const articleRes2 = res2.body.article as ArticleResponseObject;
      expect(articleRes2.favorited).toEqual(true);
    });
    it("GET should return 404 if article doesn't exist", async () => {
      const res = await request(server).get('/api/articles/doesntexist');
      expect(res.statusCode).toEqual(404);
    });
    it('PUT should update article if exists and user is authorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res1 = await createArticleRequest(newArticle, authorization);
      const articleRes1Slug = res1.body.article.slug;
      const res2 = await request(server)
        .put('/api/articles/' + articleRes1Slug)
        .set('Authorization', authorization)
        .send(updateArticleDto);

      const articleRes2 = res1.body.article;
      expect(res2.statusCode).toEqual(201);
      expect(articleRes2.body).toEqual('new_body');
      expect(articleRes2.description).toEqual('new_description');
      expect(articleRes2.title).toEqual('new_title');
    });
    it("PUT should return 404 if article doesn't exist", async () => {
      const authorization = await login(existingUser1);
      const res = await request(server)
        .put('/api/articles/doesntexist')
        .set('Authorization', authorization)
        .send(updateArticleDto);
      expect(res.statusCode).toEqual(404);
    });
    it('PUT should return 401 if user is unauthorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res = await createArticleRequest(newArticle, authorization);
      const articleRes = res.body.article as ArticleResponseObject;
      const slug = articleRes.slug;
      const res1 = await request(server)
        .put(`/api/articles/${slug}`)
        .send(updateArticleDto);
      expect(res1.statusCode).toEqual(401);
    });
    it('DELETE should delete article if exists and user is authorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res = await createArticleRequest(newArticle, authorization);
      const articleRes1Slug = res.body.article.slug;
      await request(server)
        .delete(`/api/articles/${articleRes1Slug}`)
        .set('Authorization', authorization);
      const res1 = await request(server).get(
        `/api/articles/${articleRes1Slug}`,
      );
      expect(res1.statusCode).toEqual(404);
    });
    it('DELETE should return 401 if user is unauthorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res = await createArticleRequest(newArticle, authorization);
      const articleRes = res.body.article as ArticleResponseObject;
      const slug = articleRes.slug;
      const res1 = await request(server)
        .delete(`/api/articles/${slug}`)
        .send(updateArticleDto);
      expect(res1.statusCode).toEqual(401);
    });
  });
  describe('[ENDPOINT]: /api/articles', () => {
    it('GET should return articles and articlesCount', async () => {
      const res = await request(server).get(`/api/articles`);
      const resBody = res.body as ArticlesResponse;
      expect(resBody).toHaveProperty('articles');
      expect(resBody).toHaveProperty('articlesCount');
      expect(resBody.articles).toHaveLength(resBody.articlesCount);
    });
    it('GET /?favorited=user should return articles that are favorited by use', async () => {
      const prefix = randomBytes(5).toString('base64');
      const newUser = {
        user: {
          email: prefix + 'email@gmail.com',
          password: 'password',
          username: prefix + 'username',
        },
      };
      const authorization = await signin(newUser);
      const authorization2 = await login(existingUser2);
      const res1 = await createArticleRequest(
        generateCreateArticleDto(),
        authorization2,
      );
      const res2 = await createArticleRequest(
        generateCreateArticleDto(),
        authorization2,
      );
      await request(server)
        .post(`/api/articles/${res1.body.article.slug}/favorite`)
        .set('Authorization', authorization);
      await request(server)
        .post(`/api/articles/${res2.body.article.slug}/favorite`)
        .set('Authorization', authorization);

      const res = await request(server).get(
        `/api/articles/?favorited=${newUser.user.username}`,
      );
      const articlesRes = res.body.articles as ArticleResponseObject[];
      expect(articlesRes).toHaveLength(2);
      articlesRes.forEach(async (article) => {
        const innerRes = await request(server)
          .get(`/api/articles/${article.slug}`)
          .set('Authorization', authorization);
        const innerArticle = innerRes.body.article as ArticleResponseObject;
        expect(innerArticle.favorited).toEqual(true);
      });
    });
    it('GET /?author=user should return articles that are created by user', async () => {
      const authorization = await login(existingUser1);
      const authorization2 = await login(existingUser2);
      await createArticleRequest(generateCreateArticleDto(), authorization);
      await createArticleRequest(generateCreateArticleDto(), authorization);
      await createArticleRequest(generateCreateArticleDto(), authorization2);
      const res = await request(server).get(
        `/api/articles/?author=${existingUser1.user.username}`,
      );
      const articlesRes = res.body.articles as ArticleResponseObject[];
      articlesRes.forEach((article) => {
        expect(article.author.username).toEqual(existingUser1.user.username);
      });
    });
    it('GET /?tag=articleTag should return articles that have a certain articleTa', async () => {
      const tag = 'React';
      const res = await request(server).get(`/api/articles/?tag=${tag}`);
      const articlesRes = res.body.articles as ArticleResponseObject[];
      articlesRes.forEach((article) => {
        expect(article.tagList).toContain(tag);
      });
    });
    it('GET /?offset={number} should return articles with offset specified by number', async () => {
      const offset = 1;
      const res = await request(server).get(`/api/articles`);
      const res1 = await request(server).get(`/api/articles/?offset=${offset}`);
      const articlesRes = res.body.articles as ArticleResponseObject[];
      const articlesRes1 = res1.body.articles as ArticleResponseObject[];
      expect(articlesRes[offset].slug).toEqual(articlesRes1[0].slug);
    });
    it('GET /?limit={number} should return articles, the max amount of articles specified by number', async () => {
      const limit = 4;
      const res = await request(server).get(`/api/articles/?limit=${limit}`);
      const articlesRes = res.body.articles;
      expect(articlesRes.length).toBeLessThanOrEqual(limit);
    });
    it('POST should return 401 when unauthorized', async () => {
      const res = await request(server)
        .post('/api/articles')
        .send(existingArticle);
      expect(res.statusCode).toEqual(401);
    });
    it('POST should return created article when authorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const res = await createArticleRequest(newArticle, authorization);
      const articleRes = res.body.article as ArticleResponseObject;
      expect(res.statusCode).toEqual(201);
      expect(articleRes.body).toEqual(newArticle.article.body);
      expect(articleRes.title).toEqual(newArticle.article.title);
      expect(articleRes.description).toEqual(newArticle.article.description);
    });
  });
  describe('[ENDPOINT]: /api/articles/feed', () => {
    it('GET should return articles only from followed authors', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      await createArticleRequest(newArticle, authorization);
      const authorization2 = await login(existingUser2);
      const res = await request(server)
        .get('/api/articles/feed')
        .set('Authorization', authorization2);
      const articles = res.body.articles as ArticleResponseObject[];
      expect(articles).toHaveLength(1);
      articles.forEach((article) => {
        expect(article.author.following).toEqual(true);
      });
    });
    it('GET should return 401 if user is unauthorized', async () => {
      const res = await request(server).get('/api/articles/feed');
      expect(res.statusCode).toEqual(401);
    });
  });
  describe('[ENDPOINT]: /api/articles/:slug/comments', () => {
    it('GET should return comments on an article', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      await request(server)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      const req1 = await request(server).get(`/api/articles/${slug}/comments`);
      const comments = req1.body.comments;
      expect(comments).toHaveLength(1);
      expect(comments[0].body).toEqual(newComment.comment.body);
    });
    it("GET should return 404 if article doesn't exist", async () => {
      const authorization = await login(existingUser1);
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req = await request(server)
        .get(`/api/articles/doesntexist/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      expect(req.statusCode).toEqual(404);
    });
    it('POST should create and return a comment if article exist', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req1 = await request(server)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      const comment = req1.body.comment;
      expect(comment.body).toEqual(newComment.comment.body);
    });
    it("POST should return 404 if article doesn't exist", async () => {
      const authorization = await login(existingUser1);
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req = await request(server)
        .post(`/api/articles/doesntexist/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      expect(req.statusCode).toEqual(404);
    });
    it('POST should return 401 if article exist and user is unauthorized', async () => {
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req = await request(server)
        .post(`/api/articles/doesntexist/comments`)
        .send(newComment);
      expect(req.statusCode).toEqual(401);
    });
  });
  describe('[ENDPOINT]: /api/articles/:slug/comments/:id', () => {
    it('DELETE should delete a comment if exists and user is authorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req1 = await request(server)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      const comment = req1.body.comment as CommentResponseObject;
      await request(server)
        .delete(`/api/articles/${slug}/comments/${comment.id}`)
        .set('Authorization', authorization);
      const req2 = await request(server).get(`/api/articles/${slug}/comments`);
      const comments = req2.body.comments;
      expect(comments).toHaveLength(0);
    });
    it('DELETE should return 401 if user is unauthorized', async () => {
      const authorization = await login(existingUser1);
      const newArticle = generateCreateArticleDto();
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      const newComment = {
        comment: {
          body: 'comment_body',
        },
      };
      const req1 = await request(server)
        .post(`/api/articles/${slug}/comments`)
        .set('Authorization', authorization)
        .send(newComment);
      const comment = req1.body.comment as CommentResponseObject;
      const req2 = await request(server).delete(
        `/api/articles/${slug}/comments/${comment.id}`,
      );
      expect(req2.statusCode).toEqual(401);
    });
    it("DELETE should return 404 if comment doesn't exist and user is authorized", async () => {
      const authorization = await login(existingUser1);
      const req = await request(server)
        .delete(`/api/articles/${existingArticleSlug}/comments/1`)
        .set('Authorization', authorization);
      expect(req.statusCode).toEqual(404);
    });
    it("DELETE should return 404 if article doesn't exist and user is authorized", async () => {
      const authorization = await login(existingUser1);
      const req = await request(server)
        .delete(`/api/articles/doesntexist/comments/1`)
        .set('Authorization', authorization);
      expect(req.statusCode).toEqual(404);
    });
  });
  describe('[ENDPOINT]: /api/articles/:slug/favorite', () => {
    it('POST should return an article with favorited property set to true', async () => {
      const newArticle = generateCreateArticleDto();
      const authorization = await login(existingUser1);
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      const req1 = await request(server)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', authorization);
      const articleReq1 = req1.body.article;
      expect(articleReq1.favorited).toEqual(true);
    });
    it('POST should return 401 is user is unauthorized', async () => {
      const req = await request(server).post(
        `/api/articles/${existingArticleSlug}/favorite`,
      );
      expect(req.statusCode).toEqual(401);
    });
    it('DELETE should return an article with favorited property set to false', async () => {
      const newArticle = generateCreateArticleDto();
      const authorization = await login(existingUser1);
      const req = await createArticleRequest(newArticle, authorization);
      const slug = req.body.article.slug;
      await request(server)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', authorization);
      const req1 = await request(server)
        .delete(`/api/articles/${slug}/favorite`)
        .set('Authorization', authorization);
      const articleReq1 = req1.body.article;
      expect(articleReq1.favorited).toEqual(false);
    });
    it('DELETE should return 401 is user is unauthorized', async () => {
      const req = await request(server).delete(
        `/api/articles/${existingArticleSlug}/favorite`,
      );
      expect(req.statusCode).toEqual(401);
    });
  });
  afterAll(async () => {
    app.close();
  });
});

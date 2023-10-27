import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { randomBytes } from 'crypto';
import { UpdateUserDto } from '../src/user/dtos/update-user.dto';
import { SigninDto } from '../src/auth/dtos/signin.dto';

describe('Profile testing', () => {
  let app: INestApplication;
  let server: any;
  const existingUser = {
    user: {
      email: 'email@gmail.com',
      password: 'password',
      username: 'username',
    },
  };
  async function signin(user: { user: SigninDto }): Promise<string> {
    const res = await request(server).post('/api/users').send(user);
    return res.headers.authorization;
  }
  function generateNewUser(definedPrefix?: string): { user: SigninDto } {
    const prefix = definedPrefix
      ? definedPrefix
      : randomBytes(5).toString('base64url');
    return {
      user: {
        email: prefix + 'email@gmail.com',
        password: 'password',
        username: prefix + 'username',
      },
    };
  }
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    await signin(existingUser);
  });

  describe('[ENDPOINT] /api/user', () => {
    it('GET should return current user if user is authorized', async () => {
      const user = generateNewUser();
      const authorization = await signin(user);
      const res = await request(server)
        .get('/api/user')
        .set('Authorization', authorization);
      expect(res.body.user.username).toEqual(user.user.username);
    });
    it('GET should return 401 if user is unauthorized', async () => {
      const res = await request(server).get('/api/user');
      expect(res.statusCode).toEqual(401);
    });
    it('PUT should update the user', async () => {
      const prefix = randomBytes(5).toString('base64url');
      const user = generateNewUser(prefix);
      const authorization = await signin(user);
      const updateDto: Partial<UpdateUserDto> = {
        bio: 'bio',
        image: 'image',
        username: prefix + 'new_username',
      };

      await request(server)
        .put('/api/user')
        .set('Authorization', authorization)
        .send({ user: updateDto });

      const res = await request(server).get(
        '/api/profiles/' + updateDto.username,
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.profile.bio).toEqual('bio');
      expect(res.body.profile.image).toEqual('image');
    });
    it('PUT should return 401 if user is unauthorized', async () => {
      const updateDto: Partial<UpdateUserDto> = {
        bio: 'bio',
        image: 'image',
        username: 'new_username',
      };

      const res = await request(server)
        .put('/api/user')
        .send({ user: updateDto });

      expect(res.statusCode).toEqual(401);
    });
  });
  describe('[ENDPOINT] /api/profiles/:username/favorite', () => {
    it('POST after following, the profile response contains following:true', async () => {
      const user = generateNewUser();
      const authorization = await signin(user);
      await request(server)
        .post(`/api/profiles/${existingUser.user.username}/follow`)
        .set('Authorization', authorization);
      const res2 = await request(server)
        .get(`/api/profiles/${existingUser.user.username}`)
        .set('Authorization', authorization);
      expect(res2.body.profile.following).toEqual(true);
    });
    it('DELETE after following, and unfollowing the profile response contains following:false', async () => {
      const user = generateNewUser();
      const authorization = await signin(user);

      await request(server)
        .post(`/api/profiles/${existingUser.user.username}/follow`)
        .set('Authorization', authorization);
      await request(server)
        .delete(`/api/profiles/${existingUser.user.username}/follow`)
        .set('Authorization', authorization);

      const res2 = await request(server)
        .get(`/api/profiles/${existingUser.user.username}`)
        .set('Authorization', authorization);

      expect(res2.body.profile.following).toEqual(false);
    });
  });
  afterAll(async () => {
    app.close();
  });
});

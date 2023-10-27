import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { randomBytes } from 'crypto';
import { SigninDto } from '../src/auth/dtos/signin.dto';
describe('Auth testing', () => {
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
  function generateNewUser(): { user: SigninDto } {
    const prefix = randomBytes(5).toString('base64');
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
  describe('[ENDPOINT] /api/users', () => {
    it('POST should create a user', async () => {
      const user = generateNewUser();
      const res = await request(server).post('/api/users').send(user);
      expect(res.statusCode).toEqual(201);
    });
    it('POST should return 400 if registering user with same credentials', async () => {
      const user = generateNewUser();
      await request(server).post('/api/users').send(user);
      const res = await request(server).post('/api/users').send(user);
      expect(res.statusCode).toEqual(400);
    });
  });
  describe('[ENDPOINT] /api/users/login', () => {
    it('POST should return 201 if logging into user that exists', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send(existingUser);
      expect(res.statusCode).toEqual(201);
    });
    it("POST should return 401 if logging into user that doesn't exist", async () => {
      const user = generateNewUser();
      const res = await request(server).post('/api/users/login').send(user);
      expect(res.statusCode).toEqual(401);
    });
    it('POST should return 401 if logging into user with wrong password', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ user: { ...existingUser.user, password: 'wrong pass' } });
      expect(res.statusCode).toEqual(401);
    });
  });
  afterAll(async () => {
    app.close();
  });
});

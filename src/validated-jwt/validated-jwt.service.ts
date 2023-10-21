import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ValidJwtEntity } from './entity/valid-jwt.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';

@Injectable()
export class ValidatedJwtService {
  private validJwts: ValidJwtEntity[] = [];
  constructor(
    @Inject('JwtService')
    private jwtService: JwtService,
    @InjectRepository(ValidJwtEntity)
    private validJwtRepository: Repository<ValidJwtEntity>,
  ) {}
  async signAsync(
    ...args: Parameters<typeof JwtService.prototype.sign>
  ): Promise<string> {
    const [payload, options] = args;
    const signId = randomBytes(10).toString('base64');
    const payloadWithSignId = { ...payload, signId };
    const signedToken = await this.jwtService.signAsync(
      payloadWithSignId,
      options,
    );
    const validJwtEntity = await this.validJwtRepository.save({ signId });
    this.validJwts.push(validJwtEntity);
    return signedToken;
  }
  async verifyAsync<T extends object = any>(
    ...args: Parameters<typeof JwtService.prototype.verify>
  ): Promise<T & { signId: string }> {
    const [token, options] = args;
    const payload = await this.jwtService.verifyAsync<T & { signId: string }>(
      token,
      options,
    );
    if (typeof payload == 'object') {
      if (payload.signId) {
        const validJwtId = this.validJwts.findIndex(
          (jwt) => jwt.signId == payload.signId,
        );
        if (validJwtId != -1) {
          return payload;
        }
        const validJwt = await this.validJwtRepository.findOneBy({
          signId: payload.signId,
        });
        if (validJwt) {
          this.validJwts.push(validJwt);
          return payload;
        }
      }
    }
    throw new UnauthorizedException('Invalid JWT token');
  }
  decode(
    ...args: Parameters<typeof JwtService.prototype.decode>
  ): string | ({ [key: string]: any } & { signId: string }) {
    const [token, options] = args;
    const payload = this.jwtService.decode(token, options) as
      | string
      | ({ [key: string]: any } & { signId: string });
    return payload;
  }

  async invalidate(signId: string): Promise<void> {
    await this.validJwtRepository.delete({ signId: signId });
    const validJwtId = this.validJwts.findIndex((jwt) => jwt.signId == signId);
    if (validJwtId != -1) {
      this.validJwts.splice(validJwtId, 1);
    }
  }
}

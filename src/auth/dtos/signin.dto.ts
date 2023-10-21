import { IsEmail, IsString } from 'class-validator';
export class SigninDto {
  @IsString()
  username: string;
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

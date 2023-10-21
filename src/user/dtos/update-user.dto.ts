import { IsEmail, IsOptional, IsString } from 'class-validator';
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email: string;
  @IsOptional()
  @IsString()
  password: string;
  @IsOptional()
  @IsString()
  username: string;
  @IsOptional()
  @IsString()
  image: string;
  @IsOptional()
  @IsString()
  bio: string;
}

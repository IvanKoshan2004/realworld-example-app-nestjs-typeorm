import { IsString, IsOptional } from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title: string;
  @IsString()
  @IsOptional()
  description: string;
  @IsString()
  @IsOptional()
  body: string;
}

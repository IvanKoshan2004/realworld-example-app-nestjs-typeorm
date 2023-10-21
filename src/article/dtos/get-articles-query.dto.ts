import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GetArticlesQueryDto {
  @IsString()
  @IsOptional()
  tag: string;

  @IsString()
  @IsOptional()
  author: string;

  @IsString()
  @IsOptional()
  favorited: string;

  @Transform((value) => parseInt(value.value))
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit = 20;

  @Transform((value) => parseInt(value.value))
  @IsInt()
  @IsOptional()
  @Min(0)
  offset = 0;
}

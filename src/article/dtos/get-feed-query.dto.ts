import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class GetFeedQueryDto {
  @Transform((value) => parseInt(value as unknown as string))
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit = 20;
  @Transform((value) => parseInt(value as unknown as string))
  @IsInt()
  @IsOptional()
  @Min(0)
  offset = 0;
}

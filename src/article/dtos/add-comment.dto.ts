import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
export class AddCommentDto {
  @IsString()
  @Transform((value) => value.value.trim())
  @IsNotEmpty()
  body: string;
}

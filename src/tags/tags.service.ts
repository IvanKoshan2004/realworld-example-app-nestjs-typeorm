import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagEntity } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { TagsResponse } from '../responses/tag-responses.type';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagEntity) private tagsRepository: Repository<TagEntity>,
  ) {}
  async getDistinctTags(): Promise<TagsResponse> {
    const tags = await this.tagsRepository
      .createQueryBuilder('tag')
      .select('tag.title')
      .distinct(true)
      .getMany();
    const tagTitles = tags.map((tag) => tag.title);
    return { tags: tagTitles };
  }
}

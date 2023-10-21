import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsResponse } from '../responses/tag-responses.type';

@Controller('/api/tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}
  @Get()
  async getTags(): Promise<TagsResponse> {
    const tags = await this.tagsService.getDistinctTags();
    return tags;
  }
}

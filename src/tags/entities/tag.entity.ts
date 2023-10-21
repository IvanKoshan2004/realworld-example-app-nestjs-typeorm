import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ArticleEntity } from '../../article/entities/article.entity';

@Entity('tag')
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 50 })
  title: string;
  @ManyToMany(() => ArticleEntity, (article) => article.id)
  @JoinTable({
    name: 'article_tag',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'article_id',
      referencedColumnName: 'id',
    },
  })
  article: ArticleEntity[];
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { ArticleEntity } from './article.entity';

@Entity('comment')
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  createdAt: Date;
  @Column()
  updatedAt: Date;
  @Column({ length: 1000 })
  body: string;
  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;
  @ManyToOne(() => ArticleEntity, (article) => article.id)
  @JoinColumn({ name: 'article_id' })
  article: ArticleEntity;
}

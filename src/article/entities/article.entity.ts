import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { CommentEntity } from './comment.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { FavoriteArticleEntity } from './favorite-article.entity';

@Entity('article')
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({ unique: true })
  title: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  body: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({
    type: 'tinyint',
    select: false,
    insert: false,
    update: false,
    nullable: true,
  })
  favoritedTinyIntBool: number;
  @Column({
    type: 'tinyint',
    select: false,
    insert: false,
    update: false,
    nullable: true,
  })
  following: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  favoritesCount: number;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.id)
  comments: CommentEntity[];

  @ManyToMany(() => TagEntity, (tag) => tag.id)
  @JoinTable({
    name: 'article_tag',
    joinColumn: { name: 'article_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: TagEntity[];

  @OneToMany(
    () => FavoriteArticleEntity,
    (favorites) => favorites.article_id_fk,
  )
  favoritedBy: FavoriteArticleEntity[];
}

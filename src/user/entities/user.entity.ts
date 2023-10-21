import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ArticleEntity } from '../../article/entities/article.entity';
import { CommentEntity } from '../../article/entities/comment.entity';
import { FavoriteArticleEntity } from '../../article/entities/favorite-article.entity';
import { FollowsEntity } from './follows.entity';

export type UserHashAlgorithm = 'sha512' | 'sha256';
@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: null })
  bio: string;

  @Column({ default: null })
  image: string;

  @Column('binary', { length: 32 })
  salt: Buffer;

  @Column({
    type: 'tinyint',
    select: false,
    insert: false,
    update: false,
    nullable: true,
  })
  followingTinyInt: number;

  @Column()
  hash_iterations: number;

  @Column({ type: 'enum', enum: ['sha512', 'sha256'] })
  hash_algorithm: UserHashAlgorithm;

  @Column('binary', { length: 64 })
  hash: Buffer;

  @OneToMany(() => ArticleEntity, (article) => article.id)
  articles: ArticleEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.id)
  comments: CommentEntity[];

  @OneToMany(() => FavoriteArticleEntity, (article) => article.user_id_fk)
  favoriteArticles: FavoriteArticleEntity[];

  @OneToMany(() => FollowsEntity, (follow) => follow.follows_id_fk)
  follows: FollowsEntity[];

  @OneToMany(() => FollowsEntity, (follow) => follow.follower_id_fk)
  followers: FollowsEntity[];
}

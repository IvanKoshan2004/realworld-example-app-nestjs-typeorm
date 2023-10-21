import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { ArticleEntity } from './article.entity';

@Entity('favorite_article')
export class FavoriteArticleEntity {
  @PrimaryColumn()
  user_id: number;
  @PrimaryColumn()
  article_id: number;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user_id_fk: UserEntity;

  @ManyToOne(() => ArticleEntity, (article) => article.id)
  @JoinColumn({ name: 'article_id' })
  article_id_fk: ArticleEntity;
}

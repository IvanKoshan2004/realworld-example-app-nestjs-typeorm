import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('follows')
export class FollowsEntity {
  @PrimaryColumn()
  follower_id: number;
  @PrimaryColumn()
  follows_id: number;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'follower_id' })
  follower_id_fk: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'follows_id' })
  follows_id_fk: UserEntity;
}

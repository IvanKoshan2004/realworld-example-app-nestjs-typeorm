import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('valid_jwt')
export class ValidJwtEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  signId: string;
}

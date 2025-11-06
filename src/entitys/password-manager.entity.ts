import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity('password_manager')
export class PasswordManager {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @VersionColumn()
  version: number;

  @Column({ type: 'int2', default: 1 })
  state: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 200 })
  username: string;

  @Column({ type: 'text' })
  encryptedPassword: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 200 })
  category: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'varchar', length: 500 })
  masterKeyHash: string;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_password_events')
@Index(['eventId'], { unique: true })
export class AuditPasswordEvents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  eventId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'datetime' })
  occurredAt: Date;

  @Column({ type: 'text' })
  payload: string;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  error?: string;
}


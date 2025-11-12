import { DataSource } from 'typeorm';
import { PasswordManager } from '../entities/password-manager.entity';
import { AuditPasswordEvents } from '../entities/audit-password-events.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.SQLITE_DB_PATH || '/data/database.sqlite',
  entities: [PasswordManager, AuditPasswordEvents],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});


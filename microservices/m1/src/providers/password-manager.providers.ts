import { DataSource } from 'typeorm';
import { PasswordManager } from 'src/entitys/password-manager.entity';

export const passwordManagerProviders = [
  {
    provide: 'PASSWORD_MANAGER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PasswordManager),
    inject: ['DATA_SOURCE'],
  },
];

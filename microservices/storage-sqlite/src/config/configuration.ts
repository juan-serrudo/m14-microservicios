import { join } from 'path';

export default () => {
  const locatePackagejson = process.cwd();
  let pm2 = false;
  if (locatePackagejson.includes('dist')) {
    pm2 = true;
  }

  return {
    packageJson: require(join(process.cwd(), pm2 ? '../package.json' : 'package.json')),
    port: parseInt(process.env.PORT || '3001', 10) || 3001,
    logLevel: process.env.LOG_LEVEL || 'info',
    sqliteDbPath: process.env.SQLITE_DB_PATH || '/data/database.sqlite',
    storageApiKey: process.env.STORAGE_API_KEY || 'change-me',
    swaggerShow: process.env.ENV_SWAGGER_SHOW === 'true' || false,
    kafkaBrokers: process.env.KAFKA_BROKERS || 'kafka:9093',
    kafkaTopicPasswordEvents: process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events',
    kafkaClientId: process.env.KAFKA_CLIENT_ID || 'storage-sqlite',
    kafkaGroupId: process.env.KAFKA_GROUP_ID || 'storage-sqlite-group',
    // OAuth2 / Keycloak for JWT Validation
    keycloakUrl: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
    keycloakRealm: process.env.KEYCLOAK_REALM || 'm14-microservicios',
    keycloakAudience: process.env.KEYCLOAK_AUDIENCE || 'password-service-client',
  };
};


import { join } from 'path';

export default () => {
  const locatePackagejson = process.cwd();
  let pm2 = false;
  if (locatePackagejson.includes('dist')) {
    pm2 = true;
  }

  return {
    packageJson: require(join(process.cwd(), pm2 ? '../package.json' : 'package.json')),
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    storageBaseUrl: process.env.STORAGE_BASE_URL || 'http://storage-sqlite:3001',
    storageApiKey: process.env.STORAGE_API_KEY || 'change-me',
    cipherSecret: process.env.CIPHER_SECRET || 'dev-secret-32bytes-min',
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '3000', 10) || 3000,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '2', 10) || 2,
    cbFailureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '5', 10) || 5,
    cbResetTimeoutMs: parseInt(process.env.CB_RESET_TIMEOUT_MS || '15000', 10) || 15000,
    swaggerShow: process.env.ENV_SWAGGER_SHOW === 'true' || false,
    kafkaBrokers: process.env.KAFKA_BROKERS || 'kafka:9093',
    kafkaTopicPasswordEvents: process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events',
    kafkaClientId: process.env.KAFKA_CLIENT_ID || 'password-service',
    useEda: process.env.USE_EDA === 'true' || false,
    // OAuth2 / Keycloak
    keycloakUrl: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
    keycloakRealm: process.env.KEYCLOAK_REALM || 'm14-microservicios',
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'password-service-client',
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'password-service-secret-2024',
  };
};


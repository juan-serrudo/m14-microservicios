export default () => {
  return {
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    storageBaseUrl: process.env.STORAGE_BASE_URL || 'http://storage-sqlite:3001',
    storageApiKey: process.env.STORAGE_API_KEY || 'change-me',
    cipherSecret: process.env.CIPHER_SECRET || 'dev-secret-32bytes-min',
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '3000', 10) || 3000,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '2', 10) || 2,
    cbFailureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '5', 10) || 5,
    cbResetTimeoutMs: parseInt(process.env.CB_RESET_TIMEOUT_MS || '15000', 10) || 15000,
  };
};


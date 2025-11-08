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
  };
};


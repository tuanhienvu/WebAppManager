const buildMysqlUrl = (prefix = ''): string | undefined => {
  const host = process.env[`${prefix}DB_HOST`];
  const port = process.env[`${prefix}DB_PORT`] ?? '3306';
  const database = process.env[`${prefix}DB_NAME`];
  const user = process.env[`${prefix}DB_USER`];
  const password = process.env[`${prefix}DB_PASSWORD`];

  if (!host || !database || !user) {
    return undefined;
  }

  const encodedPassword = password ? `:${encodeURIComponent(password)}` : '';
  return `mysql://${user}${encodedPassword}@${host}:${port}/${database}`;
};

if (!process.env.DATABASE_URL) {
  const primaryUrl = buildMysqlUrl();
  if (primaryUrl) {
    process.env.DATABASE_URL = primaryUrl;
  }
}

if (!process.env.DATABASE_URL_FALLBACK) {
  const fallbackUrl = buildMysqlUrl('FALLBACK_');
  if (fallbackUrl) {
    process.env.DATABASE_URL_FALLBACK = fallbackUrl;
  }
}

export {};


import './db-config';
import { PrismaClient } from '@prisma/client';

type DatasourceLabel = 'primary' | 'fallback';

interface PrismaGlobal {
  prisma?: PrismaClient;
  prismaInit?: Promise<PrismaClient>;
  prismaDatasource?: DatasourceLabel;
}

const globalForPrisma = globalThis as unknown as PrismaGlobal;

const primaryUrl = process.env.DATABASE_URL;
const fallbackUrl = process.env.DATABASE_URL_FALLBACK;

const createClient = (url?: string) =>
  url ? new PrismaClient({ datasources: { db: { url } } }) : new PrismaClient();

async function initClient(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prismaInit) {
    return globalForPrisma.prismaInit;
  }

  const attempts: Array<{ url?: string; label: DatasourceLabel }> = [];

  if (primaryUrl) {
    attempts.push({ url: primaryUrl, label: 'primary' });
  } else {
    // Prisma will default to process.env.DATABASE_URL internally when url is undefined
    attempts.push({ label: 'primary' });
  }

  if (fallbackUrl) {
    attempts.push({ url: fallbackUrl, label: 'fallback' });
  }

  globalForPrisma.prismaInit = (async () => {
    let lastError: unknown;

    for (const attempt of attempts) {
      const client = createClient(attempt.url);
      try {
        await client.$connect();
        globalForPrisma.prismaDatasource = attempt.label;
        return client;
      } catch (error) {
        lastError = error;
        await client.$disconnect().catch(() => {
          // ignore disconnect errors
        });

        if (attempt.label === 'primary') {
          console.error('[Prisma] Primary database connection failed:', error);
        } else {
          console.error('[Prisma] Fallback database connection failed:', error);
        }
      }
    }

    throw lastError ?? new Error('Unable to connect to any configured database');
  })();

  try {
    const client = await globalForPrisma.prismaInit;
    globalForPrisma.prisma = client;
    return client;
  } finally {
    globalForPrisma.prismaInit = undefined;
  }
}

export async function getPrismaClient(): Promise<PrismaClient> {
  return initClient();
}

export function getActiveDatasource(): DatasourceLabel | undefined {
  return globalForPrisma.prismaDatasource;
}


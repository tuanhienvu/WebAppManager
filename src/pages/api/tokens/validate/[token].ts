import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../../lib/prisma';
import { LOG_ACTION } from '../../../../lib/prisma-constants';

const mapPermissions = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return [];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { token } = req.query;
    const prisma = await getPrismaClient();
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const tokenRecord = await prisma.accessToken.findUnique({
      where: { token: token as string },
      include: {
        software: true,
        version: true,
      },
    });

    if (!tokenRecord) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      // Update status if not already expired
      if (tokenRecord.status !== 'EXPIRED') {
        await prisma.accessToken.update({
          where: { id: tokenRecord.id },
          data: { status: 'EXPIRED' },
        });
      }

      // Log the validation attempt
      await prisma.auditLog.create({
        data: {
          tokenId: tokenRecord.id,
          action: LOG_ACTION.VALIDATE,
          ipAddress,
          userAgent,
        },
      });

      return res.status(400).json({
        error: 'Token expired',
        token: {
          id: tokenRecord.id,
          status: 'EXPIRED',
          expiresAt: tokenRecord.expiresAt,
        },
      });
    }

    // Check if token is revoked
    if (tokenRecord.status === 'REVOKED') {
      await prisma.auditLog.create({
        data: {
          tokenId: tokenRecord.id,
          action: LOG_ACTION.VALIDATE,
          ipAddress,
          userAgent,
        },
      });

      return res.status(403).json({
        error: 'Token revoked',
        token: {
          id: tokenRecord.id,
          status: 'REVOKED',
        },
      });
    }

    // Log successful validation
    await prisma.auditLog.create({
      data: {
        tokenId: tokenRecord.id,
        action: LOG_ACTION.VALIDATE,
        ipAddress,
        userAgent,
      },
    });

    return res.status(200).json({
      valid: true,
      token: {
        id: tokenRecord.id,
        status: tokenRecord.status,
        permissions: mapPermissions(tokenRecord.permissions),
        expiresAt: tokenRecord.expiresAt,
        software: {
          id: tokenRecord.software.id,
          name: tokenRecord.software.name,
        },
        version: tokenRecord.version
          ? {
              id: tokenRecord.version.id,
              version: tokenRecord.version.version,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error in token validation API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


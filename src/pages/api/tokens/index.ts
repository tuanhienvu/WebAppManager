import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';
import { TokenStatus, Permission, Prisma } from '@prisma/client';

function generateToken(): string {
  return `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

function mapPermissions(value: Prisma.JsonValue): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return [];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method === 'GET') {
      const {
        softwareId,
        versionId,
        status,
        owner,
        includeSoftware,
        includeVersion,
        expired,
      } = req.query;
      const prisma = await getPrismaClient();

      const where: {
        softwareId?: string;
        versionId?: string;
        status?: TokenStatus;
        owner?: string;
        expiresAt?: { lt: Date } | { gte: Date };
      } = {};
      if (softwareId) where.softwareId = softwareId as string;
      if (versionId) where.versionId = versionId as string;
      if (status) where.status = status as TokenStatus;
      if (owner) where.owner = owner as string;
      if (expired === 'true') {
        where.expiresAt = { lt: new Date() };
      } else if (expired === 'false') {
        where.expiresAt = { gte: new Date() };
      }

      const tokens = await prisma.accessToken.findMany({
        where,
        include: {
          software: includeSoftware === 'true',
          version: includeVersion === 'true',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const normalizedTokens = tokens.map((token) => ({
        ...token,
        permissions: mapPermissions(token.permissions),
      }));

      return res.status(200).json(normalizedTokens);
    }

    if (req.method === 'POST') {
      const {
        softwareId,
        versionId,
        token,
        expiresAt,
        permissions,
        status,
        owner,
        blockchainTxHash,
      } = req.body;
      const prisma = await getPrismaClient();

      if (!softwareId || !expiresAt) {
        return res.status(400).json({
          error: 'softwareId and expiresAt are required',
        });
      }

      // Verify software exists
      const software = await prisma.software.findUnique({
        where: { id: softwareId },
      });

      if (!software) {
        return res.status(404).json({ error: 'Software not found' });
      }

      // Verify version exists if provided
      if (versionId) {
        const version = await prisma.version.findUnique({
          where: { id: versionId },
        });
        if (!version) {
          return res.status(404).json({ error: 'Version not found' });
        }
        if (version.softwareId !== softwareId) {
          return res.status(400).json({
            error: 'Version does not belong to the specified software',
          });
        }
      }

      // Validate status
      const validStatuses = Object.values(TokenStatus);
      const tokenStatus = status || TokenStatus.ACTIVE;
      if (!validStatuses.includes(tokenStatus)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      if (permissions !== undefined && !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions must be an array' });
      }

      // Validate permissions
      const validPermissions = Object.values(Permission);
      if (permissions && Array.isArray(permissions)) {
        const invalidPermissions = permissions.filter(
          (p) => !validPermissions.includes(p),
        );
        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          });
        }
      }

      const sanitizedPermissions = permissions && Array.isArray(permissions) ? permissions : [];

      const tokenRecord = await prisma.accessToken.create({
        data: {
          token: token || generateToken(),
          softwareId,
          versionId: versionId || null,
          expiresAt: new Date(expiresAt),
          permissions: sanitizedPermissions as Prisma.InputJsonValue,
          status: tokenStatus,
          owner: owner || null,
          blockchainTxHash: blockchainTxHash || null,
        },
      });

      return res.status(201).json({
        ...tokenRecord,
        permissions: mapPermissions(tokenRecord.permissions),
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Token already exists' });
    }
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


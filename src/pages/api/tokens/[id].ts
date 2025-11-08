import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';
import { TokenStatus, Permission, Prisma } from '@prisma/client';

const mapPermissions = (value: Prisma.JsonValue): string[] => {
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
    const { id } = req.query;
    const prisma = await getPrismaClient();

    if (req.method === 'GET') {
      const { includeSoftware, includeVersion } = req.query;

      const token = await prisma.accessToken.findUnique({
        where: { id: id as string },
        include: {
          software: includeSoftware === 'true',
          version: includeVersion === 'true',
        },
      });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      return res.status(200).json({
        ...token,
        permissions: mapPermissions(token.permissions),
      });
    }

    if (req.method === 'PUT') {
      const {
        token,
        versionId,
        expiresAt,
        permissions,
        status,
        owner,
        blockchainTxHash,
      } = req.body;

      const updateData: Prisma.AccessTokenUpdateInput = {};
      if (token) updateData.token = token;
      if (versionId !== undefined) {
        if (versionId) {
          // Verify version exists
          const version = await prisma.version.findUnique({
            where: { id: versionId },
          });
          if (!version) {
            return res.status(404).json({ error: 'Version not found' });
          }
          updateData.version = {
            connect: { id: versionId },
          };
        } else {
          updateData.version = {
            disconnect: true,
          };
        }
      }
      if (expiresAt) updateData.expiresAt = new Date(expiresAt);
      if (permissions !== undefined) {
        if (!Array.isArray(permissions)) {
          return res.status(400).json({ error: 'permissions must be an array' });
        }
        const validPermissions = Object.values(Permission);
        const invalidPermissions = permissions.filter(
          (p: string) => !validPermissions.includes(p as Permission),
        );
        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          });
        }
        updateData.permissions = permissions as Prisma.InputJsonValue;
      }
      if (status) {
        const validStatuses = Object.values(TokenStatus);
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        updateData.status = status;
      }
      if (owner !== undefined) updateData.owner = owner;
      if (blockchainTxHash !== undefined)
        updateData.blockchainTxHash = blockchainTxHash;

      const tokenRecord = await prisma.accessToken.update({
        where: { id: id as string },
        data: updateData,
      });

      return res.status(200).json({
        ...tokenRecord,
        permissions: mapPermissions(tokenRecord.permissions),
      });
    }

    if (req.method === 'DELETE') {
      await prisma.accessToken.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Token not found' });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Token already exists' });
      }
    }
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


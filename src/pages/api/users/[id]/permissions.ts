import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../../lib/prisma';
import {
  PERMISSION_VALUES,
  type PermissionValue,
} from '../../../../lib/prisma-constants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { id } = req.query;
    const prisma = await getPrismaClient();

    if (req.method === 'GET') {
      const permissions = await prisma.userPermission.findMany({
        where: { userId: id as string },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(permissions);
    }

    if (req.method === 'POST') {
      const { permission, resource } = req.body;

      if (!permission) {
        return res.status(400).json({ error: 'permission is required' });
      }

      if (!PERMISSION_VALUES.includes(permission)) {
        return res.status(400).json({ error: 'Invalid permission value' });
      }

      const userPermission = await prisma.userPermission.create({
        data: {
          userId: id as string,
          permission: permission as PermissionValue,
          resource: resource || null,
        },
      });

      return res.status(201).json(userPermission);
    }

    if (req.method === 'PUT') {
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions must be an array' });
      }

      const invalidPermissions = permissions.filter(
        (p: { permission: string; resource?: string }) =>
          !PERMISSION_VALUES.includes(p.permission as PermissionValue),
      );

      if (invalidPermissions.length > 0) {
        return res.status(400).json({ error: 'Invalid permission values' });
      }

      // Delete all existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId: id as string },
      });

      // Create new permissions
      if (permissions.length > 0) {
        await prisma.userPermission.createMany({
          data: permissions.map((p: { permission: string; resource?: string }) => ({
            userId: id as string,
            permission: p.permission as PermissionValue,
            resource: p.resource || null,
          })),
        });
      }

      const updatedPermissions = await prisma.userPermission.findMany({
        where: { userId: id as string },
      });

      return res.status(200).json(updatedPermissions);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    console.error('Error in user permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


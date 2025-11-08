import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../../../lib/password';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { id } = req.query;
    const prisma = await getPrismaClient();

    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: id as string },
        include: {
          permissions: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (req.method === 'PUT') {
      const { name, email, role, phone, avatar, password, isActive } = req.body;

      const updateData: {
        name?: string;
        email?: string;
        role?: UserRole;
        phone?: string | null;
        avatar?: string | null;
        password?: string;
        isActive?: boolean;
      } = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) {
        const validRoles = Object.values(UserRole);
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        updateData.role = role;
      }
      if (phone !== undefined) updateData.phone = phone || null;
      if (avatar !== undefined) updateData.avatar = avatar || null;
      if (password) {
        updateData.password = await hashPassword(password);
      }
      if (isActive !== undefined) updateData.isActive = isActive;

      const user = await prisma.user.update({
        where: { id: id as string },
        data: updateData,
        include: {
          permissions: true,
        },
      });

      const { password: _, ...safeUser } = user;
      return res.status(200).json(safeUser);
    }

    if (req.method === 'DELETE') {
      await prisma.user.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


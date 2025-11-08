import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/password';
import {
  USER_ROLE,
  USER_ROLE_VALUES,
} from '../../../lib/prisma-constants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prisma = await getPrismaClient();
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        include: {
          permissions: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Remove password from response
      const safeUsers = users.map(
        ({ password: _password, ...user }: (typeof users)[number]) => user,
      );
      return res.status(200).json(safeUsers);
    }

    if (req.method === 'POST') {
      const { email, name, password, role, phone, avatar } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({
          error: 'email, name, and password are required',
        });
      }

      // Validate role
      const userRole = (role as (typeof USER_ROLE_VALUES)[number]) ?? USER_ROLE.USER;
      if (!USER_ROLE_VALUES.includes(userRole)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // In production, hash the password here
      // For now, storing plain text (NOT RECOMMENDED FOR PRODUCTION)
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: userRole,
          phone: phone || null,
          avatar: avatar || null,
        },
      });

      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'User already exists' });
    }
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


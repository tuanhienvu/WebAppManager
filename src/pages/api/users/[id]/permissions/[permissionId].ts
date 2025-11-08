import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { id, permissionId } = req.query;
    const prisma = await getPrismaClient();

    if (req.method === 'DELETE') {
      await prisma.userPermission.delete({
        where: { id: permissionId as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Permission not found' });
    }
    console.error('Error in user permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


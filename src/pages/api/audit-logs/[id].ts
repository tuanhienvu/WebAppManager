import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { id } = req.query;
    const prisma = await getPrismaClient();

    if (req.method === 'GET') {
      const log = await prisma.auditLog.findUnique({
        where: { id: id as string },
      });

      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      return res.status(200).json(log);
    }

    if (req.method === 'DELETE') {
      await prisma.auditLog.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    console.error('Error in audit-logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


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
      const { includeVersions, includeTokens } = req.query;

      const software = await prisma.software.findUnique({
        where: { id: id as string },
        include: {
          versions: includeVersions === 'true',
          tokens: includeTokens === 'true',
          _count: {
            select: {
              versions: true,
              tokens: true,
            },
          },
        },
      });

      if (!software) {
        return res.status(404).json({ error: 'Software not found' });
      }

      return res.status(200).json(software);
    }

    if (req.method === 'PUT') {
      const { name, description } = req.body;

      const software = await prisma.software.update({
        where: { id: id as string },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      return res.status(200).json(software);
    }

    if (req.method === 'DELETE') {
      await prisma.software.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Software not found' });
    }
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


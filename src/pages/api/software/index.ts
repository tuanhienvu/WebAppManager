import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prisma = await getPrismaClient();
    if (req.method === 'GET') {
      const { includeVersions, includeTokens } = req.query;
      
      const software = await prisma.software.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(software);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const software = await prisma.software.create({
        data: {
          name,
          description,
        },
      });

      return res.status(201).json(software);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


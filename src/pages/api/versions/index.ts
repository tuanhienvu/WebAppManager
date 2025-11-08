import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prisma = await getPrismaClient();
    if (req.method === 'GET') {
      const { softwareId, includeSoftware, includeTokens } = req.query;

      const versions = await prisma.version.findMany({
        where: softwareId ? { softwareId: softwareId as string } : undefined,
        include: {
          software: includeSoftware === 'true',
          tokens: includeTokens === 'true',
          _count: {
            select: {
              tokens: true,
            },
          },
        },
        orderBy: {
          releaseDate: 'desc',
        },
      });

      return res.status(200).json(versions);
    }

    if (req.method === 'POST') {
      const { softwareId, version, releaseDate, changelog } = req.body;

      if (!softwareId || !version || !releaseDate) {
        return res.status(400).json({
          error: 'softwareId, version, and releaseDate are required',
        });
      }

      // Verify software exists
      const software = await prisma.software.findUnique({
        where: { id: softwareId },
      });

      if (!software) {
        return res.status(404).json({ error: 'Software not found' });
      }

      const versionRecord = await prisma.version.create({
        data: {
          softwareId,
          version,
          releaseDate: new Date(releaseDate),
          changelog,
        },
      });

      return res.status(201).json(versionRecord);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


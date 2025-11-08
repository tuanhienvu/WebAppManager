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
      const { includeSoftware, includeTokens } = req.query;

      const version = await prisma.version.findUnique({
        where: { id: id as string },
        include: {
          software: includeSoftware === 'true',
          tokens: includeTokens === 'true',
          _count: {
            select: {
              tokens: true,
            },
          },
        },
      });

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      return res.status(200).json(version);
    }

    if (req.method === 'PUT') {
      const { version, releaseDate, changelog, softwareId } = req.body;

      const updateData: {
        version?: string;
        releaseDate?: Date;
        changelog?: string | null;
        softwareId?: string;
      } = {};
      if (version) updateData.version = version;
      if (releaseDate) updateData.releaseDate = new Date(releaseDate);
      if (changelog !== undefined) updateData.changelog = changelog;
      if (softwareId) {
        // Verify software exists
        const software = await prisma.software.findUnique({
          where: { id: softwareId },
        });
        if (!software) {
          return res.status(404).json({ error: 'Software not found' });
        }
        updateData.softwareId = softwareId;
      }

      const versionRecord = await prisma.version.update({
        where: { id: id as string },
        data: updateData,
      });

      return res.status(200).json(versionRecord);
    }

    if (req.method === 'DELETE') {
      await prisma.version.delete({
        where: { id: id as string },
      });

      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Version not found' });
    }
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


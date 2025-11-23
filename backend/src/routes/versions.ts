import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { softwareId } = req.query;

    const where = softwareId ? { softwareId: String(softwareId) } : {};

    const versions = await prisma.version.findMany({
      where,
      include: {
        software: true,
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
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { softwareId, version, releaseDate, changelog } = req.body;

    if (!softwareId || !version || !releaseDate) {
      return res.status(400).json({ error: 'Software ID, version, and release date are required' });
    }

    const newVersion = await prisma.version.create({
      data: {
        softwareId,
        version,
        releaseDate: new Date(releaseDate),
        changelog,
      },
      include: {
        software: true,
      },
    });

    return res.status(201).json(newVersion);
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const version = await prisma.version.findUnique({
      where: { id },
      include: {
        software: true,
        tokens: true,
      },
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    return res.status(200).json(version);
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;
    const { version, releaseDate, changelog } = req.body;

    const updatedVersion = await prisma.version.update({
      where: { id },
      data: {
        version,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        changelog,
      },
      include: {
        software: true,
      },
    });

    return res.status(200).json(updatedVersion);
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.version.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in versions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
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
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
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
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const software = await prisma.software.findUnique({
      where: { id },
      include: {
        versions: true,
        tokens: true,
      },
    });

    if (!software) {
      return res.status(404).json({ error: 'Software not found' });
    }

    return res.status(200).json(software);
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const software = await prisma.software.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return res.status(200).json(software);
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.software.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in software API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


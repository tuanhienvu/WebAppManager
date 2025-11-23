import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { TOKEN_STATUS } from '../lib/prisma-constants';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { softwareId, status } = req.query;

    const where: any = {};
    if (softwareId) where.softwareId = String(softwareId);
    if (status) where.status = String(status);

    const tokens = await prisma.accessToken.findMany({
      where,
      include: {
        software: true,
        version: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(tokens);
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { softwareId, versionId, expiresAt, permissions, owner } = req.body;

    if (!softwareId || !expiresAt) {
      return res.status(400).json({ error: 'Software ID and expiration date are required' });
    }

    // Generate unique token
    const token = `tk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newToken = await prisma.accessToken.create({
      data: {
        token,
        softwareId,
        versionId: versionId || null,
        expiresAt: new Date(expiresAt),
        permissions: permissions || [],
        status: TOKEN_STATUS.ACTIVE,
        owner: owner || null,
      },
      include: {
        software: true,
        version: true,
      },
    });

    return res.status(201).json(newToken);
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const token = await prisma.accessToken.findUnique({
      where: { id },
      include: {
        software: true,
        version: true,
      },
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    return res.status(200).json(token);
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;
    const { expiresAt, permissions, status, owner } = req.body;

    const updatedToken = await prisma.accessToken.update({
      where: { id },
      data: {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        permissions: permissions,
        status: status,
        owner: owner,
      },
      include: {
        software: true,
        version: true,
      },
    });

    return res.status(200).json(updatedToken);
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.accessToken.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in tokens API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/validate/:token', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { token } = req.params;

    const accessToken = await prisma.accessToken.findUnique({
      where: { token },
      include: {
        software: true,
        version: true,
      },
    });

    if (!accessToken) {
      return res.status(404).json({ valid: false, error: 'Token not found' });
    }

    const isExpired = new Date(accessToken.expiresAt) < new Date();
    const isActive = accessToken.status === TOKEN_STATUS.ACTIVE;

    if (!isActive || isExpired) {
      return res.status(200).json({ valid: false, reason: isExpired ? 'expired' : 'revoked' });
    }

    return res.status(200).json({ valid: true, token: accessToken });
  } catch (error) {
    console.error('Error validating token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


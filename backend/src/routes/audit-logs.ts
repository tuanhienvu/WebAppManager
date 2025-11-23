import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { tokenId, action, startDate, endDate, limit, offset } = req.query;

    const where: any = {};
    if (tokenId) where.tokenId = String(tokenId);
    if (action) where.action = String(action);
    
    // Date range filtering
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(String(startDate));
      }
      if (endDate) {
        // Set to end of day for endDate
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    // Parse pagination parameters
    const limitNum = limit ? parseInt(String(limit), 10) : 20;
    const offsetNum = offset ? parseInt(String(offset), 10) : 0;

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where });

    // Get paginated results
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    return res.status(200).json({
      logs: auditLogs,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Error in audit logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { tokenId, action, ipAddress, userAgent, blockchainTxHash } = req.body;

    if (!tokenId || !action) {
      return res.status(400).json({ error: 'Token ID and action are required' });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        tokenId,
        action,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        blockchainTxHash: blockchainTxHash || null,
      },
    });

    return res.status(201).json(auditLog);
  } catch (error) {
    console.error('Error in audit logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    return res.status(200).json(auditLog);
  } catch (error) {
    console.error('Error in audit logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.auditLog.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in audit logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


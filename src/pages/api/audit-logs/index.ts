import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';
import { LogAction } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prisma = await getPrismaClient();
    if (req.method === 'GET') {
      const {
        tokenId,
        action,
        limit,
        offset,
        startDate,
        endDate,
      } = req.query;

      const where: {
        tokenId?: string;
        action?: LogAction;
        timestamp?: {
          gte?: Date;
          lte?: Date;
        };
      } = {};
      if (tokenId) where.tokenId = tokenId as string;
      if (action) where.action = action as LogAction;

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate as string);
        if (endDate) where.timestamp.lte = new Date(endDate as string);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        take: limit ? parseInt(limit as string) : undefined,
        skip: offset ? parseInt(offset as string) : undefined,
        orderBy: {
          timestamp: 'desc',
        },
      });

      const total = await prisma.auditLog.count({ where });

      return res.status(200).json({
        logs,
        pagination: {
          total,
          limit: limit ? parseInt(limit as string) : null,
          offset: offset ? parseInt(offset as string) : 0,
        },
      });
    }

    if (req.method === 'POST') {
      const { tokenId, action, ipAddress, userAgent, blockchainTxHash } =
        req.body;

      if (!tokenId || !action) {
        return res.status(400).json({
          error: 'tokenId and action are required',
        });
      }

      // Verify token exists
      const token = await prisma.accessToken.findUnique({
        where: { id: tokenId },
      });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      // Validate action
      const validActions = Object.values(LogAction);
      if (!validActions.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const log = await prisma.auditLog.create({
        data: {
          tokenId,
          action,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          blockchainTxHash: blockchainTxHash || null,
        },
      });

      return res.status(201).json(log);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error in audit-logs API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


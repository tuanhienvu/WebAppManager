import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/audit-logs/index';
import handlerId from '../../pages/api/audit-logs/[id]';
import { LogAction } from '@prisma/client';
import { createMockPrismaClient } from '../lib/mock-prisma';

jest.mock('../../lib/prisma', () => {
  const { createMockPrismaClient } = require('../lib/mock-prisma');
  const mockPrisma = createMockPrismaClient();
  return {
    getPrismaClient: jest.fn().mockResolvedValue(mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

const { getPrismaClient, __mockPrisma } = require('../../lib/prisma');
const mockPrisma = __mockPrisma;

describe('/api/audit-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockResolvedValue(mockPrisma);
  });

  describe('GET /api/audit-logs', () => {
    it('should return all audit logs with pagination', async () => {
      const mockLogs = [
        {
          id: '1',
          tokenId: '1',
          action: LogAction.VALIDATE,
          timestamp: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        },
      ];

      mockPrisma.auditLog.findMany = jest.fn().mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count = jest.fn().mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.logs).toEqual(mockLogs);
      expect(data.pagination.total).toBe(1);
    });

    it('should filter by tokenId', async () => {
      mockPrisma.auditLog.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.auditLog.count = jest.fn().mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        query: { tokenId: '1' },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tokenId: '1',
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      mockPrisma.auditLog.findMany = jest.fn().mockResolvedValue([]);
      mockPrisma.auditLog.count = jest.fn().mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '10', offset: '5' },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('POST /api/audit-logs', () => {
    it('should create new audit log', async () => {
      const newLog = {
        id: '1',
        tokenId: '1',
        action: LogAction.VALIDATE,
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      mockPrisma.accessToken.findUnique = jest.fn().mockResolvedValue({ id: '1' });
      mockPrisma.auditLog.create = jest.fn().mockResolvedValue(newLog);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          tokenId: '1',
          action: LogAction.VALIDATE,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(201);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          tokenId: '1',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 404 if token not found', async () => {
      mockPrisma.accessToken.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          tokenId: '999',
          action: LogAction.VALIDATE,
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('GET /api/audit-logs/[id]', () => {
    it('should return audit log by id', async () => {
      const mockLog = {
        id: '1',
        tokenId: '1',
        action: LogAction.VALIDATE,
        timestamp: new Date(),
      };

      mockPrisma.auditLog.findUnique = jest.fn().mockResolvedValue(mockLog);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(mockLog);
    });

    it('should return 404 if log not found', async () => {
      mockPrisma.auditLog.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '999' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('DELETE /api/audit-logs/[id]', () => {
    it('should delete audit log', async () => {
      mockPrisma.auditLog.delete = jest.fn().mockResolvedValue({});

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(204);
    });
  });
});


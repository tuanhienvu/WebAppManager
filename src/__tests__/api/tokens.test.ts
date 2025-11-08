import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/tokens/index';
import handlerId from '../../pages/api/tokens/[id]';
import handlerValidate from '../../pages/api/tokens/validate/[token]';
import { TOKEN_STATUS, PERMISSION } from '../../lib/prisma-constants';
import { createMockPrismaClient } from '../lib/mock-prisma';

jest.mock('../../lib/prisma', () => {
  const { createMockPrismaClient } = require('../lib/mock-prisma');
  const mockPrisma = createMockPrismaClient();
  return {
    getPrismaClient: jest.fn().mockResolvedValue(mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

const { __mockPrisma, getPrismaClient } = require('../../lib/prisma');
const mockPrisma = __mockPrisma;

describe('/api/tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockResolvedValue(mockPrisma);
  });

  describe('GET /api/tokens', () => {
    it('should return all tokens', async () => {
      const mockTokens = [
        {
          id: '1',
          token: 'test-token',
          softwareId: '1',
          versionId: null,
          status: TOKEN_STATUS.ACTIVE,
          permissions: [PERMISSION.READ],
          expiresAt: new Date('2025-12-31'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.accessToken.findMany = jest.fn().mockResolvedValue(mockTokens);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(mockTokens);
    });

    it('should filter by softwareId', async () => {
      mockPrisma.accessToken.findMany = jest.fn().mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { softwareId: '1' },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(mockPrisma.accessToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            softwareId: '1',
          }),
        }),
      );
    });
  });

  describe('POST /api/tokens', () => {
    it('should create new token', async () => {
      const newToken = {
        id: '1',
        token: 'generated-token',
        softwareId: '1',
        versionId: null,
        status: TOKEN_STATUS.ACTIVE,
        permissions: [],
        expiresAt: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.software.findUnique = jest.fn().mockResolvedValue({ id: '1' });
      mockPrisma.accessToken.create = jest.fn().mockResolvedValue(newToken);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          softwareId: '1',
          expiresAt: '2025-12-31',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(201);
      expect(mockPrisma.accessToken.create).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          softwareId: '1',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('softwareId and expiresAt are required');
    });

    it('should return 404 if software not found', async () => {
      mockPrisma.software.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          softwareId: '999',
          expiresAt: '2025-12-31',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Software not found');
    });
  });

  describe('GET /api/tokens/validate/[token]', () => {
    it('should validate active token', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockToken = {
        id: '1',
        token: 'valid-token',
        status: TOKEN_STATUS.ACTIVE,
        expiresAt: futureDate,
        permissions: [PERMISSION.READ],
        software: { id: '1', name: 'Test Software' },
        version: null,
      };

      mockPrisma.accessToken.findUnique = jest.fn().mockResolvedValue(mockToken);
      mockPrisma.auditLog.create = jest.fn().mockResolvedValue({});

      const { req, res } = createMocks({
        method: 'GET',
        query: { token: 'valid-token' },
        headers: {
          'user-agent': 'Test Agent',
        },
      });

      await handlerValidate(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.valid).toBe(true);
      expect(data.token.status).toBe(TOKEN_STATUS.ACTIVE);
    });

    it('should return 400 if token is expired', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockToken = {
        id: '1',
        token: 'expired-token',
        status: TOKEN_STATUS.ACTIVE,
        expiresAt: pastDate,
        permissions: [],
        software: { id: '1', name: 'Test Software' },
        version: null,
      };

      mockPrisma.accessToken.findUnique = jest.fn().mockResolvedValue(mockToken);
      mockPrisma.accessToken.update = jest.fn().mockResolvedValue({});
      mockPrisma.auditLog.create = jest.fn().mockResolvedValue({});

      const { req, res } = createMocks({
        method: 'GET',
        query: { token: 'expired-token' },
      });

      await handlerValidate(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Token expired');
    });

    it('should return 404 if token not found', async () => {
      mockPrisma.accessToken.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { token: 'non-existent' },
      });

      await handlerValidate(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Token not found');
    });
  });
});


import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/versions/index';
import handlerId from '../../pages/api/versions/[id]';
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

describe('/api/versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockResolvedValue(mockPrisma);
  });

  describe('GET /api/versions', () => {
    it('should return all versions', async () => {
      const mockVersions = [
        {
          id: '1',
          softwareId: '1',
          version: '1.0.0',
          releaseDate: new Date('2024-01-01'),
          changelog: 'Initial release',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.version.findMany = jest.fn().mockResolvedValue(mockVersions);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(mockVersions);
    });

    it('should filter by softwareId', async () => {
      mockPrisma.version.findMany = jest.fn().mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { softwareId: '1' },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(mockPrisma.version.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            softwareId: '1',
          }),
        }),
      );
    });
  });

  describe('POST /api/versions', () => {
    it('should create new version', async () => {
      const newVersion = {
        id: '1',
        softwareId: '1',
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        changelog: 'Initial release',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.software.findUnique = jest.fn().mockResolvedValue({ id: '1' });
      mockPrisma.version.create = jest.fn().mockResolvedValue(newVersion);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          softwareId: '1',
          version: '1.0.0',
          releaseDate: '2024-01-01',
          changelog: 'Initial release',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(201);
      expect(mockPrisma.version.create).toHaveBeenCalled();
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
    });

    it('should return 404 if software not found', async () => {
      mockPrisma.software.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          softwareId: '999',
          version: '1.0.0',
          releaseDate: '2024-01-01',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('PUT /api/versions/[id]', () => {
    it('should update version', async () => {
      const updatedVersion = {
        id: '1',
        softwareId: '1',
        version: '1.1.0',
        releaseDate: new Date('2024-02-01'),
        changelog: 'Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.version.update = jest.fn().mockResolvedValue(updatedVersion);

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: '1' },
        body: {
          version: '1.1.0',
        },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('DELETE /api/versions/[id]', () => {
    it('should delete version', async () => {
      mockPrisma.version.delete = jest.fn().mockResolvedValue({});

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(204);
    });
  });
});


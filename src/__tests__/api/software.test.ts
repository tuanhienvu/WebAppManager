import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/software/index';
import handlerId from '../../pages/api/software/[id]';
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

describe('/api/software', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockResolvedValue(mockPrisma);
  });

  describe('GET /api/software', () => {
    it('should return all software', async () => {
      const mockSoftware = [
        {
          id: '1',
          name: 'Test Software',
          description: 'Test Description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.software.findMany = jest.fn().mockResolvedValue(mockSoftware);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(mockSoftware);
      expect(mockPrisma.software.findMany).toHaveBeenCalledTimes(1);
    });

    it('should include versions when includeVersions is true', async () => {
      mockPrisma.software.findMany = jest.fn().mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { includeVersions: 'true' },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(mockPrisma.software.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            versions: true,
          }),
        }),
      );
    });
  });

  describe('POST /api/software', () => {
    it('should create new software', async () => {
      const newSoftware = {
        id: '1',
        name: 'New Software',
        description: 'New Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.software.create = jest.fn().mockResolvedValue(newSoftware);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'New Software',
          description: 'New Description',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(newSoftware);
      expect(mockPrisma.software.create).toHaveBeenCalledWith({
        data: {
          name: 'New Software',
          description: 'New Description',
        },
      });
    });

    it('should return 400 if name is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          description: 'No name',
        },
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Name is required');
    });

    it('should return 405 for unsupported method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('GET /api/software/[id]', () => {
    it('should return software by id', async () => {
      const mockSoftware = {
        id: '1',
        name: 'Test Software',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.software.findUnique = jest.fn().mockResolvedValue(mockSoftware);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(mockSoftware);
    });

    it('should return 404 if software not found', async () => {
      mockPrisma.software.findUnique = jest.fn().mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '999' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Software not found');
    });
  });

  describe('PUT /api/software/[id]', () => {
    it('should update software', async () => {
      const updatedSoftware = {
        id: '1',
        name: 'Updated Software',
        description: 'Updated Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.software.update = jest.fn().mockResolvedValue(updatedSoftware);

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: '1' },
        body: {
          name: 'Updated Software',
          description: 'Updated Description',
        },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual(updatedSoftware);
    });
  });

  describe('DELETE /api/software/[id]', () => {
    it('should delete software', async () => {
      mockPrisma.software.delete = jest.fn().mockResolvedValue({});

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      });

      await handlerId(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res._getStatusCode()).toBe(204);
      expect(mockPrisma.software.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});


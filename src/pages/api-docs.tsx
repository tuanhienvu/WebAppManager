import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

import 'swagger-ui-react/swagger-ui.css';

interface ApiDocsProps {
  spec: any;
}

const ApiDocs = ({ spec }: ApiDocsProps) => {
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Explore the WebApp Manager REST API endpoints and schemas.
          </p>
        </div>
        <div className="px-0 py-0">
          <div className="min-h-[70vh]">
            <SwaggerUI spec={spec} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'WebApp Manager API',
      version: '1.0.0',
      description: 'API documentation for WebApp Manager - Software, Version, AccessToken, and AuditLog management',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Software', description: 'Software management endpoints' },
      { name: 'Versions', description: 'Version management endpoints' },
      { name: 'Tokens', description: 'Access token management endpoints' },
      { name: 'Audit Logs', description: 'Audit log endpoints' },
    ],
    paths: {
      '/api/software': {
        get: {
          tags: ['Software'],
          summary: 'Get all software',
          parameters: [
            {
              name: 'includeVersions',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Include versions in response',
            },
            {
              name: 'includeTokens',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Include tokens in response',
            },
          ],
          responses: {
            '200': {
              description: 'List of software',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Software' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Software'],
          summary: 'Create new software',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Software created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Software' },
                },
              },
            },
            '400': { description: 'Bad request' },
          },
        },
      },
      '/api/software/{id}': {
        get: {
          tags: ['Software'],
          summary: 'Get software by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Software found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Software' },
                },
              },
            },
            '404': { description: 'Software not found' },
          },
        },
        put: {
          tags: ['Software'],
          summary: 'Update software',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Software updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Software' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Software'],
          summary: 'Delete software',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Software deleted' },
            '404': { description: 'Software not found' },
          },
        },
      },
      '/api/versions': {
        get: {
          tags: ['Versions'],
          summary: 'Get all versions',
          parameters: [
            {
              name: 'softwareId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by software ID',
            },
          ],
          responses: {
            '200': {
              description: 'List of versions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Version' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Versions'],
          summary: 'Create new version',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['softwareId', 'version', 'releaseDate'],
                  properties: {
                    softwareId: { type: 'string' },
                    version: { type: 'string' },
                    releaseDate: { type: 'string', format: 'date-time' },
                    changelog: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Version created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Version' },
                },
              },
            },
          },
        },
      },
      '/api/versions/{id}': {
        get: {
          tags: ['Versions'],
          summary: 'Get version by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Version found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Version' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Versions'],
          summary: 'Update version',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    version: { type: 'string' },
                    releaseDate: { type: 'string', format: 'date-time' },
                    changelog: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Version updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Version' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Versions'],
          summary: 'Delete version',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Version deleted' },
          },
        },
      },
      '/api/tokens': {
        get: {
          tags: ['Tokens'],
          summary: 'Get all access tokens',
          parameters: [
            {
              name: 'softwareId',
              in: 'query',
              schema: { type: 'string' },
            },
            {
              name: 'versionId',
              in: 'query',
              schema: { type: 'string' },
            },
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
              },
            },
            {
              name: 'owner',
              in: 'query',
              schema: { type: 'string' },
            },
            {
              name: 'expired',
              in: 'query',
              schema: { type: 'boolean' },
            },
          ],
          responses: {
            '200': {
              description: 'List of tokens',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AccessToken' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Tokens'],
          summary: 'Create new access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['softwareId', 'expiresAt'],
                  properties: {
                    softwareId: { type: 'string' },
                    versionId: { type: 'string' },
                    token: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    permissions: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['READ', 'WRITE', 'SYNC', 'EXCHANGE', 'EXTEND'],
                      },
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
                      default: 'ACTIVE',
                    },
                    owner: { type: 'string' },
                    blockchainTxHash: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Token created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AccessToken' },
                },
              },
            },
          },
        },
      },
      '/api/tokens/{id}': {
        get: {
          tags: ['Tokens'],
          summary: 'Get token by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Token found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AccessToken' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Tokens'],
          summary: 'Update token',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    versionId: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    permissions: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['READ', 'WRITE', 'SYNC', 'EXCHANGE', 'EXTEND'],
                      },
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
                    },
                    owner: { type: 'string' },
                    blockchainTxHash: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AccessToken' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Tokens'],
          summary: 'Delete token',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Token deleted' },
          },
        },
      },
      '/api/tokens/validate/{token}': {
        get: {
          tags: ['Tokens'],
          summary: 'Validate access token',
          parameters: [
            {
              name: 'token',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Token is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      token: { $ref: '#/components/schemas/AccessToken' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Token expired' },
            '403': { description: 'Token revoked' },
            '404': { description: 'Token not found' },
          },
        },
      },
      '/api/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Get all audit logs',
          parameters: [
            {
              name: 'tokenId',
              in: 'query',
              schema: { type: 'string' },
            },
            {
              name: 'action',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['VALIDATE', 'EXTEND', 'REVOKE', 'EXCHANGE', 'CREATE'],
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer' },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer' },
            },
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
            },
          ],
          responses: {
            '200': {
              description: 'List of audit logs with pagination',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      logs: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AuditLog' },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          limit: { type: 'integer' },
                          offset: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Audit Logs'],
          summary: 'Create new audit log',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tokenId', 'action'],
                  properties: {
                    tokenId: { type: 'string' },
                    action: {
                      type: 'string',
                      enum: ['VALIDATE', 'EXTEND', 'REVOKE', 'EXCHANGE', 'CREATE'],
                    },
                    ipAddress: { type: 'string' },
                    userAgent: { type: 'string' },
                    blockchainTxHash: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Audit log created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuditLog' },
                },
              },
            },
          },
        },
      },
      '/api/audit-logs/{id}': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Get audit log by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Audit log found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuditLog' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Audit Logs'],
          summary: 'Delete audit log',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Audit log deleted' },
          },
        },
      },
    },
    components: {
      schemas: {
        Software: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Version: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            softwareId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
            releaseDate: { type: 'string', format: 'date-time' },
            changelog: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AccessToken: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            token: { type: 'string' },
            softwareId: { type: 'string', format: 'uuid' },
            versionId: { type: 'string', format: 'uuid', nullable: true },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['READ', 'WRITE', 'SYNC', 'EXCHANGE', 'EXTEND'],
              },
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
            },
            owner: { type: 'string', nullable: true },
            blockchainTxHash: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tokenId: { type: 'string', format: 'uuid' },
            action: {
              type: 'string',
              enum: ['VALIDATE', 'EXTEND', 'REVOKE', 'EXCHANGE', 'CREATE'],
            },
            timestamp: { type: 'string', format: 'date-time' },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            blockchainTxHash: { type: 'string', nullable: true },
          },
        },
      },
    },
  };

  return {
    props: {
      spec,
    },
  };
};

export default ApiDocs;


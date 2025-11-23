import { PrismaClient } from '@prisma/client';
import '../src/lib/db-config'; // Ensure DATABASE_URL is set from individual variables
import { hashPassword } from '../src/lib/password';
import {
  TOKEN_STATUS,
  PERMISSION,
  LOG_ACTION,
  USER_ROLE,
} from '../src/lib/prisma-constants';
import {
  getRoleDefaultMatrix,
  matrixToAssignments,
  crudToDbPermission,
} from '../src/lib/authorization';

const prisma = new PrismaClient();

function generateToken(): string {
  return `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

function generateBlockchainHash(): string {
  return `0x${Math.random().toString(16).substring(2, 66)}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.accessToken.deleteMany();
  await prisma.version.deleteMany();
  await prisma.software.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await hashPassword('@5801507746#VULEITS');
  const adminUser = await prisma.user.create({
    data: {
      email: 'vuleitsolution@gmail.com',
      name: 'System Administrator',
      password: adminPasswordHash,
      role: USER_ROLE.ADMIN,
      phone: '+84 963 373 213',
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create MANAGER user
  console.log('👤 Creating manager user...');
  const managerPasswordHash1 = await hashPassword('Vuhien@1982');
  const managerUser1 = await prisma.user.create({
    data: {
      email: 'tuanhienvu@gmail.com',
      name: 'Operations Manager',
      password: managerPasswordHash1,
      role: USER_ROLE.MANAGER,
      phone: '+84 982 068 806',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
  });
  console.log(`✅ Manager user created: ${managerUser1.email}`);

  // Create USER role user
  console.log('👤 Creating regular user...');
  const userPasswordHash1 = await hashPassword('Vuhien@1982');
  const regularUser1 = await prisma.user.create({
    data: {
      email: 'user@vuleits.com',
      name: 'QA Specialist',
      password: userPasswordHash1,
      role: USER_ROLE.USER,
      phone: '+1 (555) 555-5555',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=32',
    },
  });
  console.log(`✅ Regular user created: ${regularUser1.email}`);

  const seedRolePermissions = async (user: { id: string; role: (typeof USER_ROLE)[keyof typeof USER_ROLE] }) => {
    const matrix = getRoleDefaultMatrix(user.role);
    const assignments = matrixToAssignments(matrix);
    if (assignments.length === 0) {
      return;
    }
    await prisma.userPermission.createMany({
      data: assignments.map(({ permission, resource }) => ({
        userId: user.id,
        permission: crudToDbPermission(permission),
        resource,
      })),
    });
  };

  await seedRolePermissions(adminUser);
  await seedRolePermissions(managerUser1);
  await seedRolePermissions(regularUser1);

  // Seed Role-Based Permissions (Full CRUD for all roles)
  console.log('🔐 Seeding role-based permissions...');
  const allRoles = [USER_ROLE.ADMIN, USER_ROLE.MANAGER, USER_ROLE.USER] as const;
  
  for (const role of allRoles) {
    const matrix = getRoleDefaultMatrix(role);
    const assignments = matrixToAssignments(matrix);
    
    if (assignments.length > 0) {
      await prisma.rolePermission.createMany({
        data: assignments.map(({ permission, resource }) => ({
          role: role,
          permission: crudToDbPermission(permission),
          resource,
        })),
      });
      console.log(`✅ Created ${assignments.length} permissions for ${role} role`);
    }
  }

  // Seed application settings
  console.log('⚙️  Seeding application settings...');
  await prisma.settings.createMany({
    data: [
      {
        key: 'companyName',
        value: 'VULE ITS',
        category: 'company',
      },
      {
        key: 'slogan',
        value: 'Bring Your Success',
        category: 'company',
      },
      {
        key: 'logo',
        value: '/uploads/Logo.jpg',
        category: 'company',
      },
      {
        key: 'email',
        value: 'info@vuleits.com',
        category: 'contact',
      },
      {
        key: 'phone',
        value: '+84 963 373 213',
        category: 'contact',
      },
      {
        key: 'socialLinks',
        value: JSON.stringify([
          { platform: 'Website', url: 'https://wam.vuleits.com' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/company/webappmanager' },
          { platform: 'GitHub', url: 'https://github.com/tuanhienvu/WebAppManager' },
        ]),
        category: 'social',
      },
    ],
  });

  // Create Software entries
  console.log('📦 Creating software entries...');
  const software1 = await prisma.software.create({
    data: {
      name: 'WebApp Manager',
      description: 'Professional web application management tool with advanced features',
    },
  });

  const software2 = await prisma.software.create({
    data: {
      name: 'API Gateway Enterprise',
      description: 'Enterprise-grade API gateway solution',
    },
  });

  const software3 = await prisma.software.create({
    data: {
      name: 'Data Sync Platform',
      description: 'Real-time data synchronization platform',
    },
  });

  const software4 = await prisma.software.create({
    data: {
      name: 'Mobile Release Tracker',
      description: 'Monitor and manage mobile app releases across app stores',
    },
  });

  // Create Versions for each software
  console.log('🔢 Creating versions...');
  const version1_1 = await prisma.version.create({
    data: {
      softwareId: software1.id,
      version: '1.0.0',
      releaseDate: new Date('2024-01-15'),
      changelog: 'Initial release with core features',
    },
  });

  const version1_2 = await prisma.version.create({
    data: {
      softwareId: software1.id,
      version: '1.1.0',
      releaseDate: new Date('2024-03-20'),
      changelog: 'Added user management and improved performance',
    },
  });

  const version1_3 = await prisma.version.create({
    data: {
      softwareId: software1.id,
      version: '2.0.0',
      releaseDate: new Date('2024-06-10'),
      changelog: 'Major update with blockchain integration and new API endpoints',
    },
  });

  const version2_1 = await prisma.version.create({
    data: {
      softwareId: software2.id,
      version: '3.5.2',
      releaseDate: new Date('2024-02-10'),
      changelog: 'Stable release with security patches',
    },
  });

  const version2_2 = await prisma.version.create({
    data: {
      softwareId: software2.id,
      version: '4.0.0',
      releaseDate: new Date('2024-05-01'),
      changelog: 'Complete rewrite with improved performance',
    },
  });

  const version3_1 = await prisma.version.create({
    data: {
      softwareId: software3.id,
      version: '2.3.1',
      releaseDate: new Date('2024-04-15'),
      changelog: 'Bug fixes and minor improvements',
    },
  });

  const version4_1 = await prisma.version.create({
    data: {
      softwareId: software4.id,
      version: '0.9.0-beta',
      releaseDate: new Date('2024-07-01'),
      changelog: 'Public beta with beta feedback module',
    },
  });

  const version4_2 = await prisma.version.create({
    data: {
      softwareId: software4.id,
      version: '1.0.0',
      releaseDate: new Date('2024-09-15'),
      changelog: 'General availability release with enhanced dashboards',
    },
  });

  // Create AccessTokens
  console.log('🔑 Creating access tokens...');
  const token1 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software1.id,
      versionId: version1_3.id,
      status: TOKEN_STATUS.ACTIVE,
      permissions: [PERMISSION.READ, PERMISSION.WRITE, PERMISSION.SYNC],
      owner: regularUser1.email,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  const token2 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software1.id,
      versionId: version1_2.id,
      status: TOKEN_STATUS.ACTIVE,
      permissions: [PERMISSION.READ],
      owner: adminUser.email,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    },
  });

  const token3 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software2.id,
      versionId: version2_2.id,
      status: TOKEN_STATUS.ACTIVE,
      permissions: [PERMISSION.READ, PERMISSION.WRITE, PERMISSION.EXCHANGE, PERMISSION.EXTEND],
      owner: managerUser1.email,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  const token4 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software2.id,
      versionId: version2_1.id,
      status: TOKEN_STATUS.EXPIRED,
      permissions: [PERMISSION.READ],
      owner: 'qa-team@example.com',
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  });

  const token5 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software3.id,
      versionId: version3_1.id,
      status: TOKEN_STATUS.ACTIVE,
      permissions: [PERMISSION.READ, PERMISSION.SYNC],
      owner: 'sync-user@example.com',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });

  const token6 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software1.id,
      status: TOKEN_STATUS.REVOKED,
      permissions: [PERMISSION.READ, PERMISSION.WRITE],
      owner: 'legacy-user@example.com',
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  const token7 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software4.id,
      versionId: version4_1.id,
      status: TOKEN_STATUS.ACTIVE,
      permissions: [PERMISSION.READ, PERMISSION.SYNC],
      owner: 'beta-tester@example.com',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    },
  });

  const token8 = await prisma.accessToken.create({
    data: {
      token: generateToken(),
      softwareId: software4.id,
      versionId: version4_2.id,
      status: TOKEN_STATUS.EXPIRED,
      permissions: [PERMISSION.READ],
      owner: 'mobile-team@example.com',
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  // Create AuditLogs
  console.log('📋 Creating audit logs...');
  await prisma.auditLog.create({
    data: {
      tokenId: token1.id,
      action: LOG_ACTION.CREATE,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token1.id,
      action: LOG_ACTION.VALIDATE,
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token2.id,
      action: LOG_ACTION.CREATE,
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token3.id,
      action: LOG_ACTION.CREATE,
      ipAddress: '172.16.0.1',
      userAgent: 'curl/7.68.0',
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token3.id,
      action: LOG_ACTION.EXTEND,
      ipAddress: '172.16.0.1',
      userAgent: 'PostmanRuntime/7.32.0',
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token4.id,
      action: LOG_ACTION.VALIDATE,
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token6.id,
      action: LOG_ACTION.REVOKE,
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token1.id,
      action: LOG_ACTION.EXCHANGE,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      blockchainTxHash: generateBlockchainHash(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token7.id,
      action: LOG_ACTION.CREATE,
      ipAddress: '203.0.113.25',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token7.id,
      action: LOG_ACTION.VALIDATE,
      ipAddress: '203.0.113.25',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    },
  });

  await prisma.auditLog.create({
    data: {
      tokenId: token8.id,
      action: LOG_ACTION.VALIDATE,
      ipAddress: '203.0.113.40',
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.rolePermission.count()} role permissions`);
  console.log(`   - ${await prisma.userPermission.count()} user permissions`);
  console.log(`   - ${await prisma.software.count()} software entries`);
  console.log(`   - ${await prisma.version.count()} versions`);
  console.log(`   - ${await prisma.accessToken.count()} access tokens`);
  console.log(`   - ${await prisma.auditLog.count()} audit logs`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


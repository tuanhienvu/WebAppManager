import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:role/permissions', authMiddleware, async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { role } = req.params;

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: role.toUpperCase() as any },
    });

    return res.status(200).json(rolePermissions);
  } catch (error) {
    console.error('Error in role permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:role/permissions', authMiddleware, async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { role } = req.params;
    const { permission, resource } = req.body;

    // Get current user's role from session
    const session = (req as any).session;
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true },
    });

    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Only ADMIN and MANAGER can create permissions
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only ADMIN and MANAGER can create permissions' });
    }

    if (!permission) {
      return res.status(400).json({ error: 'Permission is required' });
    }

    const rolePermission = await prisma.rolePermission.create({
      data: {
        role: role.toUpperCase() as any,
        permission,
        resource: resource || null,
      },
    });

    return res.status(201).json(rolePermission);
  } catch (error) {
    console.error('Error in role permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update role permissions (bulk update)
router.put('/:role/permissions', authMiddleware, async (req, res) => {
  try {
    console.log(`PUT /api/roles/${req.params.role}/permissions - Received request`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const prisma = await getPrismaClient();
    const { role } = req.params;
    const { permissions } = req.body;
    
    // Get current user's role from session
    const session = (req as any).session;
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true, email: true },
    });
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log(`User ${currentUser.email} (${currentUser.role}) attempting to modify ${role} permissions`);
    
    // Authorization checks
    const roleUpper = role.toUpperCase() as 'ADMIN' | 'MANAGER' | 'USER';
    
    // Only ADMIN and MANAGER can modify permissions
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      console.log('❌ Permission denied: Only ADMIN and MANAGER can modify permissions');
      return res.status(403).json({ error: 'Only ADMIN and MANAGER can modify permissions' });
    }
    
    // Prevent modifying ADMIN role (to prevent lockout)
    if (roleUpper === 'ADMIN') {
      console.log('❌ Permission denied: Cannot modify ADMIN role permissions');
      return res.status(403).json({ error: 'ADMIN role permissions cannot be modified' });
    }
    
    // ADMIN and MANAGER can modify permissions for MANAGER and USER roles
    if (roleUpper !== 'MANAGER' && roleUpper !== 'USER') {
      console.log('❌ Permission denied: Can only modify MANAGER and USER role permissions');
      return res.status(403).json({ error: 'Can only modify MANAGER and USER role permissions' });
    }
    
    console.log('✅ Authorization passed');

    if (!Array.isArray(permissions)) {
      console.log('Error: Permissions is not an array');
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    console.log(`Deleting existing permissions for role: ${roleUpper}`);
    // Delete all existing permissions for this role
    const deleteResult = await prisma.rolePermission.deleteMany({
      where: { role: roleUpper as any },
    });
    console.log(`Deleted ${deleteResult.count} existing permissions`);

    console.log(`Creating ${permissions.length} new permissions for role: ${roleUpper}`);
    
    // Validate and log each permission before creating
    const permissionsToCreate = permissions.map((p: any) => {
      const perm = {
        role: roleUpper as any,
        permission: p.permission,
        resource: p.resource || null,
      };
      console.log('  → Creating permission:', JSON.stringify(perm));
      return perm;
    });
    
    // Create new permissions
    if (permissionsToCreate.length > 0) {
      const createdPermissions = await prisma.rolePermission.createMany({
        data: permissionsToCreate,
      });
      console.log(`✅ Created ${createdPermissions.count} permissions`);
    } else {
      console.log('⚠️  No permissions to create (all checkboxes unchecked)');
    }

    // Fetch and return the updated permissions
    const updatedPermissions = await prisma.rolePermission.findMany({
      where: { role: roleUpper as any },
      orderBy: [
        { resource: 'asc' },
        { permission: 'asc' },
      ],
    });

    console.log(`\n✅ Role permissions updated successfully for ${role}`);
    console.log(`   Expected: ${permissions.length} permissions`);
    console.log(`   In DB: ${updatedPermissions.length} permissions`);
    
    if (updatedPermissions.length !== permissions.length && permissions.length > 0) {
      console.warn(`⚠️  WARNING: Mismatch! Expected ${permissions.length} but found ${updatedPermissions.length} in DB`);
    }
    
    console.log('\nFinal permissions in database:');
    updatedPermissions.forEach(p => {
      console.log(`  - ${p.resource}: ${p.permission}`);
    });
    console.log('');
    
    return res.status(200).json(updatedPermissions);
  } catch (error) {
    console.error('Error in role permissions bulk update API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


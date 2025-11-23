import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { hashPassword } from '../lib/password';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { email, name, password, role, avatar, phone } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Rule 1: No user can be assigned ADMIN role (except system admin)
    const SYSTEM_ADMIN_EMAIL = 'vuleitsolution@gmail.com';
    if (role === 'ADMIN' && email.toLowerCase() !== SYSTEM_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'ADMIN role cannot be assigned to users' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER',
        avatar,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;
    const { email, name, password, role, avatar, phone, isActive } = req.body;

    // Get the current user to check if it's the system admin
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const SYSTEM_ADMIN_EMAIL = 'vuleitsolution@gmail.com';
    const isSystemAdmin = currentUser.email.toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase();

    // Rule 1: No user can be assigned ADMIN role (except system admin)
    if (role === 'ADMIN' && !isSystemAdmin) {
      return res.status(403).json({ error: 'ADMIN role cannot be assigned to users' });
    }

    // Rule 2: System admin cannot be assigned to lower roles (MANAGER, USER)
    if (isSystemAdmin && role && role !== 'ADMIN') {
      return res.status(403).json({ error: 'System admin cannot be assigned to lower roles' });
    }

    const updateData: any = {
      email,
      name,
      role,
      avatar,
      phone,
      isActive,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/permissions', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    const permissions = await prisma.userPermission.findMany({
      where: { userId: id },
    });

    return res.status(200).json(permissions);
  } catch (error) {
    console.error('Error in user permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/permissions', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;
    const { permission, resource } = req.body;

    if (!permission) {
      return res.status(400).json({ error: 'Permission is required' });
    }

    const userPermission = await prisma.userPermission.create({
      data: {
        userId: id,
        permission,
        resource: resource || null,
      },
    });

    return res.status(201).json(userPermission);
  } catch (error) {
    console.error('Error in user permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/permissions/:permissionId', async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { permissionId } = req.params;

    await prisma.userPermission.delete({
      where: { id: permissionId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in user permissions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


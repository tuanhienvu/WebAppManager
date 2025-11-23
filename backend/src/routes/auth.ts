import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { verifyPassword } from '../lib/password';
import { serialize } from 'cookie';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const prisma = await getPrismaClient();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create session data (without password)
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
    };

    // Set cookie with session data
    const cookie = serialize(
      'auth-session',
      JSON.stringify({
        ...sessionData,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      },
    );

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({
      success: true,
      user: sessionData,
    });
  } catch (error: unknown) {
    console.error('Error in login API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  const cookie = serialize('auth-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const session = req.session;
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch user and their role permissions from database
    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Fetch role permissions from RolePermission table based on user's role
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: user.role },
      select: {
        permission: true,
        resource: true,
      },
    });

    // Map to rolePermissions format for frontend
    const rolePermissionsFormatted = rolePermissions.map(p => ({
      permission: p.permission,
      resource: p.resource || '',
    }));

    return res.status(200).json({
      user: {
        ...user,
        rolePermissions: rolePermissionsFormatted,
      },
    });
  } catch (error: unknown) {
    console.error('Error in me API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


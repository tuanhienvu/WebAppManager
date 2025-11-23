import { Router } from 'express';
import { getPrismaClient } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { category } = req.query;

    const where = category ? { category: String(category) } : {};

    const settings = await prisma.settings.findMany({
      where,
      orderBy: {
        key: 'asc',
      },
    });

    // Transform array to object for frontend
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string | null>);

    console.log('GET /api/settings - Returning settings:', JSON.stringify(settingsObject, null, 2));

    return res.status(200).json(settingsObject);
  } catch (error) {
    console.error('Error in settings API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { key, value, category } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      create: {
        key,
        value,
        category,
      },
      update: {
        value,
        category,
      },
    });

    return res.status(200).json(setting);
  } catch (error) {
    console.error('Error in settings API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle bulk update (PUT request with object of key-value pairs)
router.put('/', authMiddleware, async (req, res) => {
  try {
    console.log('PUT /api/settings - Received request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const prisma = await getPrismaClient();
    const settingsObject = req.body;

    if (typeof settingsObject !== 'object' || settingsObject === null) {
      console.log('Error: Invalid request body type');
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    // Map to determine category for each setting key
    const categoryMap: Record<string, string> = {
      companyName: 'company',
      slogan: 'company',
      logo: 'company',
      address: 'company',
      email: 'contact',
      phone: 'contact',
      mobile: 'contact',
      socialLinks: 'social',
    };

    // Update each setting
    const updatePromises = Object.entries(settingsObject).map(async ([key, value]) => {
      const category = categoryMap[key] || 'general';
      const stringValue = value === null ? null : String(value);
      
      console.log(`Upserting setting: ${key} = ${stringValue} (category: ${category})`);
      
      const result = await prisma.settings.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          category,
        },
        update: {
          value: stringValue,
          category,
        },
      });
      
      console.log(`Upserted setting ${key}:`, result.id);
      return result;
    });

    const results = await Promise.all(updatePromises);

    console.log(`Settings updated successfully. Total updated: ${results.length}`);
    
    // Verify the data was saved
    const savedSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: Object.keys(settingsObject),
        },
      },
    });
    console.log(`Verification: Found ${savedSettings.length} saved settings in database`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Settings updated successfully',
      updatedCount: results.length 
    });
  } catch (error) {
    console.error('Error in settings bulk update API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    const { id } = req.params;

    await prisma.settings.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error in settings API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


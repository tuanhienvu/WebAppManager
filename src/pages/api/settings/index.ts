import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrismaClient } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prisma = await getPrismaClient();
    if (req.method === 'GET') {
      const { category } = req.query;

      const where: { category?: string } = {};
      if (category) {
        where.category = category as string;
      }

      const settings = await prisma.settings.findMany({
        where,
        orderBy: { key: 'asc' },
      });

      // Convert array to object for easier frontend access
      const settingsObj = settings.reduce(
        (
          acc: Record<string, string | null>,
          setting: (typeof settings)[number],
        ) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, string | null>,
      );

      return res.status(200).json(settingsObj);
    }

    if (req.method === 'PUT') {
      const settings = req.body;

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object is required' });
      }

      const results = [];

      for (const [key, value] of Object.entries(settings)) {
        // Skip null values - delete the setting if value is null
        if (value === null || value === undefined) {
          try {
            await prisma.settings.deleteMany({
              where: { key },
            });
          } catch (deleteError) {
            // Ignore errors if setting doesn't exist
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to delete setting ${key}:`, deleteError);
            }
          }
          continue;
        }

        // Convert value to string (handle objects/arrays by JSON.stringify)
        let stringValue: string;
        try {
          if (typeof value === 'object' && value !== null) {
            stringValue = JSON.stringify(value);
          } else {
            stringValue = String(value);
          }
        } catch (stringifyError) {
          console.error(`Failed to stringify value for key ${key}:`, stringifyError);
          continue; // Skip this setting if we can't stringify it
        }

        try {
          const setting = await prisma.settings.upsert({
            where: { key },
            update: {
              value: stringValue,
              updatedAt: new Date(),
            },
            create: {
              key,
              value: stringValue,
              category: determineCategory(key),
            },
          });
          results.push(setting);
        } catch (upsertError) {
          console.error(`Failed to upsert setting ${key}:`, upsertError);
          // Continue with other settings even if one fails
        }
      }

      return res.status(200).json({ success: true, settings: results });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: unknown) {
    console.error('Error in settings API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

function determineCategory(key: string): string {
  const companyKeys = ['companyName', 'slogan', 'logo', 'address'];
  const contactKeys = ['email', 'phone', 'mobile'];

  if (companyKeys.includes(key)) return 'company';
  if (contactKeys.includes(key)) return 'contact';
  if (key === 'socialLinks') return 'social';
  if (key.toLowerCase().includes('social') || key.toLowerCase().includes('link')) return 'social';
  return 'general';
}


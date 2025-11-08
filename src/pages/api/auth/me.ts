import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies['auth-session'];

    if (!sessionCookie) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    try {
      const user = JSON.parse(sessionCookie);
      return res.status(200).json({ authenticated: true, user });
    } catch {
      return res.status(200).json({ authenticated: false, user: null });
    }
  } catch (error: unknown) {
    console.error('Error in auth check API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

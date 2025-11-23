import { Request, Response, NextFunction } from 'express';
import { SessionData } from '../types/session';

export interface AuthRequest extends Request {
  session?: SessionData;
}

export function parseSessionCookie(cookieHeader?: string): SessionData | null {
  if (!cookieHeader) {
    return null;
  }
  
  try {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const raw = cookies['auth-session'];
    if (!raw) {
      return null;
    }
    
    const session = JSON.parse(decodeURIComponent(raw)) as SessionData;
    if (!session?.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie;
  const session = parseSessionCookie(cookieHeader);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.session = session;
  next();
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie;
  const session = parseSessionCookie(cookieHeader);
  
  if (session) {
    req.session = session;
  }
  
  next();
}


export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface SessionData extends SessionUser {
  expiresAt: number;
}


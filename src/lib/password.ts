import bcrypt from 'bcryptjs';

const DEFAULT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(DEFAULT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
}


import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash plain password using bcrypt with strong cost factor
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

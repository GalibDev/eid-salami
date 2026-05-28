import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

const COOKIE_NAME = "eid_admin_token";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing. Add it to .env.local.");
  return secret;
}

export async function ensureAdmin() {
  await connectDB();

  const username = "owner";
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) throw new Error("ADMIN_PASSWORD is missing. Add it to .env.local.");

  const admin = await Admin.findOne({ username });
  if (admin) return admin;

  const passwordHash = await bcrypt.hash(envPassword, 12);
  return Admin.create({ username, passwordHash });
}

export async function verifyAdminPassword(password: string) {
  const admin = await ensureAdmin();
  const envPassword = process.env.ADMIN_PASSWORD;

  if (envPassword && password === envPassword) return admin;
  const matchesStoredPassword = await bcrypt.compare(password, admin.passwordHash);
  return matchesStoredPassword ? admin : null;
}

export function signAdminToken(adminId: string) {
  return jwt.sign({ adminId, role: "owner" }, getJwtSecret(), { expiresIn: "7d" });
}

export function setAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

export function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret()) as { adminId: string; role: string };
  } catch {
    return null;
  }
}

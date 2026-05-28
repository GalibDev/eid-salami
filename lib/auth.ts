import bcrypt from "bcryptjs";
import crypto from "crypto";
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
  if (admin) {
    if (!admin.name) {
      admin.name = "Owner";
      await admin.save();
    }
    return admin;
  }

  const passwordHash = await bcrypt.hash(envPassword, 12);
  return Admin.create({ name: "Owner", username, passwordHash });
}

export async function verifyAdminPassword(password: string, username = "owner") {
  await ensureAdmin();
  const envPassword = process.env.ADMIN_PASSWORD;
  const admin = await Admin.findOne({ username: username.trim().toLowerCase() });

  if (!admin) return null;

  if (admin.username === "owner" && envPassword && password === envPassword) return admin;
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

export function buildGoogleUsername(email: string) {
  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 28);
}

export async function findOrCreateGoogleAdmin({
  name,
  email,
  googleId,
  image
}: {
  name: string;
  email: string;
  googleId: string;
  image?: string;
}) {
  await connectDB();

  const cleanEmail = email.trim().toLowerCase();
  const allowedEmails = (process.env.ADMIN_GOOGLE_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length && !allowedEmails.includes(cleanEmail)) {
    throw new Error("This Google email is not allowed as an admin.");
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ email: cleanEmail }, { googleId }]
  });

  if (existingAdmin) {
    existingAdmin.name = existingAdmin.name || name || "Google Admin";
    existingAdmin.email = existingAdmin.email || cleanEmail;
    existingAdmin.googleId = existingAdmin.googleId || googleId;
    existingAdmin.authProvider = existingAdmin.authProvider || "google";
    existingAdmin.profileImageUrl = existingAdmin.profileImageUrl || image || "";
    await existingAdmin.save();
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
  const baseUsername = buildGoogleUsername(cleanEmail) || "googleadmin";
  let username = baseUsername;
  let suffix = 1;

  while (await Admin.findOne({ username })) {
    username = `${baseUsername}${suffix}`;
    suffix += 1;
  }

  return Admin.create({
    name: name || "Google Admin",
    username,
    email: cleanEmail,
    googleId,
    authProvider: "google",
    profileImageUrl: image || "",
    passwordHash
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

export async function getCurrentAdmin() {
  const payload = requireAdmin();
  if (!payload) return null;

  await connectDB();
  return Admin.findById(payload.adminId);
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const setupPassword = formData.get("setupPassword");
    const envPassword = process.env.ADMIN_PASSWORD;
    const canUpload = Boolean(requireAdmin()) || Boolean(envPassword && setupPassword === envPassword);

    if (!canUpload) {
      return NextResponse.json({ ok: false, message: "Unauthorized upload." }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Image file is required." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ ok: false, message: "Only JPG, PNG, WEBP or GIF images are allowed." }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "Image must be 2MB or smaller." }, { status: 400 });
    }

    const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "admin");
    const uploadPath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();

    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, Buffer.from(bytes));

    return NextResponse.json({ ok: true, url: `/uploads/admin/${filename}` });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Image upload failed." },
      { status: 500 }
    );
  }
}

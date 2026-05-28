import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Code from "@/models/Code";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { code, claimPhone } = (await request.json()) as {
      code?: string;
      claimPhone?: string;
    };
    const cleanCode = code?.trim().toUpperCase();
    const cleanPhone = claimPhone?.trim().slice(0, 30) || "";

    if (!cleanCode) {
      return NextResponse.json({ ok: false, message: "Code is required." }, { status: 400 });
    }

    const updatedCode = await Code.findOneAndUpdate(
      { code: cleanCode, isUsed: true },
      { $set: { claimPhone: cleanPhone, claimedAt: cleanPhone ? new Date() : null } },
      { new: true }
    ).lean();

    if (!updatedCode) {
      return NextResponse.json({ ok: false, message: "Spin result was not found for this code." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not save claim number." },
      { status: 500 }
    );
  }
}

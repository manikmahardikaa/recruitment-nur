import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import db from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

export const POST = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const email =
      typeof body?.email === "string" ? body.email.trim() : undefined;
    const token =
      typeof body?.token === "string" ? body.token.trim() : undefined;
    const password =
      typeof body?.password === "string" ? body.password : undefined;

    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, message: "Email, token, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        user: {
          email,
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      await db.passwordResetToken.deleteMany({
        where: { user_id: resetToken.user_id },
      });
      return NextResponse.json(
        { success: false, message: "Reset link has expired." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: resetToken.user_id },
      data: { password: hashedPassword },
    });

    await db.passwordResetToken.deleteMany({
      where: { user_id: resetToken.user_id },
    });

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

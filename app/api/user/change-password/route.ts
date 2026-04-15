import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-token";
import { CHANGE_USER_PASSWORD } from "@/app/providers/user";
import { GeneralError } from "@/app/utils/general-error";

const MIN_PASSWORD_LENGTH = 8;

export const POST = async (req: NextRequest) => {
  const token = req.cookies.get("auth_token")?.value;
  const session = verifyAuthToken(token);
  const userId = session?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "Current password and new password are required.",
      },
      { status: 400 }
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "New password must be different from the current password.",
      },
      { status: 400 }
    );
  }

  try {
    await CHANGE_USER_PASSWORD(userId, currentPassword, newPassword);
    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof GeneralError) {
      return NextResponse.json(
        {
          success: false,
          message: error.error,
          error_code: error.error_code,
          details: error.details,
        },
        { status: error.code }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update password.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

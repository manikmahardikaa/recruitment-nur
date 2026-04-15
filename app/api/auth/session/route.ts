import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-token";

const COOKIE_NAME = "auth_token";

export const GET = async (req: NextRequest) => {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = verifyAuthToken(token);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
      },
    },
    { status: 200 }
  );
};

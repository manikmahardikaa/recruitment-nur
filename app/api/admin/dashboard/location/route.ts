import { LocationPayloadCreateModel } from "@/app/models/location";
import { CREATE_LOCATION, GET_LOCATIONS } from "@/app/providers/location";
import { GeneralError } from "@/app/utils/general-error";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const merchantId = req.nextUrl.searchParams.get("merchant_id") || undefined;
    const userId = req.nextUrl.searchParams.get("user_id") || undefined;
    const data = await GET_LOCATIONS({
      merchant_id: merchantId,
      user_id: userId,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Successfully get data!",
        result: data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
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

    console.error("[LOCATION][GET] unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const payload: LocationPayloadCreateModel = await req.json();

    const data = await CREATE_LOCATION(payload);

    return NextResponse.json(
      {
        success: true,
        message: "Successfully created data!",
        result: data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID tidak ditemukan, pastikan memilih user yang valid.",
          error_code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
};

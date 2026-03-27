import { GET_PROFILE_COMPANY_MERCHANT_ID } from "@/app/providers/profile-company";
import { GeneralError } from "@/app/utils/general-error";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("merchantId") as string;

    const data = await GET_PROFILE_COMPANY_MERCHANT_ID(id);

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
    console.error(
      "[api/admin/dashboard/profile-company/profile-company-by-merchantId] unexpected error",
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error_code: "UNHANDLED_EXCEPTION",
      },
      { status: 500 }
    );
  }
};

import { ApplicantPayloadCreateModel } from "@/app/models/applicant";
import {
  CREATE_APPLICANT,
  GET_APPLICANT,
  GET_APPLICANTS,
} from "@/app/providers/applicant";
import { GET_JOB } from "@/app/providers/job";
import { GeneralError } from "@/app/utils/general-error";
import { sendRecruitmentEmail } from "@/app/vendor/send-email";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const payload: ApplicantPayloadCreateModel = await req.json();

    const data = await CREATE_APPLICANT(payload);

    const getDetailJob = await GET_JOB(payload.job_id);
    const getDetailCandidate = await GET_APPLICANT(payload.user_id);
    await sendRecruitmentEmail(
      getDetailCandidate!.user.email,
      getDetailCandidate!.user.name,
      {
        type: "applied",
        jobTitle: getDetailJob?.job_title ?? getDetailJob?.id ?? "Unknown Job",
        idApply: getDetailJob?.id,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Successfully registered!",
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to register user",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const merchantId =
      req.nextUrl.searchParams.get("merchant_id") || undefined;
    const data = await GET_APPLICANTS(merchantId);
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

    // return NextResponse.json(
    //   {
    //     success: false,
    //     message: "Failed to get data",
    //     error: error instanceof Error ? error.message : "Internal server error",
    //   },
    //   { status: 500 }
    // );
  }
};

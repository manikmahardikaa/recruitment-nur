import { ApplicantPayloadCreateModel } from "@/app/models/applicant";
import { CREATE_APPLICANT, GET_APPLICANTS } from "@/app/providers/applicant";
import { GET_JOB } from "@/app/providers/job";
import { GET_USER } from "@/app/providers/user";
import { GeneralError } from "@/app/utils/general-error";
import { sendRecruitmentEmail } from "@/app/vendor/send-email";
import db from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  let payload: ApplicantPayloadCreateModel | null = null;
  try {
    payload = (await req.json()) as ApplicantPayloadCreateModel | null;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload",
          error_code: "BAD_REQUEST",
          details: "Payload tidak valid.",
        },
        { status: 400 }
      );
    }
    if (!payload.user_id || !payload.job_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload",
          error_code: "BAD_REQUEST",
          details: "user_id dan job_id wajib diisi",
        },
        { status: 400 }
      );
    }

    const data = await CREATE_APPLICANT(payload);

    // Kirim email jika data tersedia. Jangan gagalkan proses apply kalau email gagal.
    try {
      const getDetailJob = await GET_JOB(payload.job_id);
      const candidateUser = await GET_USER(payload.user_id);
      if (candidateUser?.email) {
        await sendRecruitmentEmail(
          candidateUser.email,
          candidateUser.name ?? "Candidate",
          {
            type: "applied",
            jobTitle: getDetailJob?.job_title ?? getDetailJob?.id ?? "Unknown Job",
            idApply: getDetailJob?.id,
          }
        );
      }
    } catch (emailError) {
      console.error("[applicant] failed to send email:", emailError);
    }

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

    // Jika error terjadi setelah applicant berhasil dibuat, balas sukses agar UX tidak gagal
    try {
      if (payload?.user_id && payload?.job_id) {
        const existing = await db.applicant.findFirst({
          where: { user_id: payload.user_id, job_id: payload.job_id },
          include: { user: true, job: true, merchant: true },
        });
        if (existing) {
          return NextResponse.json(
            {
              success: true,
              message: "Successfully registered!",
              result: existing,
              warning: "Recovered after internal error.",
            },
            { status: 200 }
          );
        }
      }
    } catch (recoveryError) {
      console.error(
        "[applicant] failed to recover after error:",
        recoveryError
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get data",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
};

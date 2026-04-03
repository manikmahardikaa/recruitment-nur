import {
  GET_APPLICANT,
  UPDATE_STATUS_CANDIDATE,
} from "@/app/providers/applicant";
import { CREATE_HISTORY_CANDIDATE } from "@/app/providers/history-candidate";
import { toRecruitmentStage } from "@/app/utils/recruitment-stage";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const id = params.id;
    const data = await GET_APPLICANT(id);
    return NextResponse.json(
      {
        success: true,
        message: "Successfully get data!",
        result: data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
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


export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const id = params.id;
    const body = await req.json();

    const stage = toRecruitmentStage(String(body.stage ?? ""));
    const data = await UPDATE_STATUS_CANDIDATE(id, stage);

    await CREATE_HISTORY_CANDIDATE({ applicantId: id, stage });

    return NextResponse.json(
      { success: true, message: "Successfully updated!", result: data },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
};

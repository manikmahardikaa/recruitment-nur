import { JobPayloadCreateModel } from "@/app/models/job";
import { CREATE_JOB, GET_JOBS } from "@/app/providers/job";
import { GeneralError } from "@/app/utils/general-error";
import { EmploymentType, TypeJob, WorkType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const EMPLOYMENT_VALUES = Object.values(EmploymentType);
const WORK_TYPE_VALUES = Object.values(WorkType);
const TYPE_JOB_VALUES = Object.values(TypeJob);

type SalaryInput =
  | number
  | string
  | { min?: number | string; max?: number | string };

type DescriptionInput =
  | string
  | {
      summary?: string;
      responsibilities?: string[] | string;
      nice_to_have?: string[] | string;
    };

const sanitizeNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const isEmploymentType = (value: unknown): value is EmploymentType =>
  typeof value === "string" && EMPLOYMENT_VALUES.includes(value as EmploymentType);

const isWorkType = (value: unknown): value is WorkType =>
  typeof value === "string" && WORK_TYPE_VALUES.includes(value as WorkType);

const isTypeJob = (value: unknown): value is TypeJob =>
  typeof value === "string" && TYPE_JOB_VALUES.includes(value as TypeJob);

const normalizeDescription = (value: DescriptionInput | undefined) => {
  if (typeof value === "string") {
    const summary = value.trim();
    if (!summary) {
      throw new Error("Job summary is required");
    }
    return {
      summary,
      sections: {
        summary,
      },
    };
  }

  if (value && typeof value === "object") {
    const summary = typeof value.summary === "string" ? value.summary.trim() : "";
    if (!summary) {
      throw new Error("Job summary is required");
    }

    const responsibilities = normalizeStringList(value.responsibilities);
    const niceToHave = normalizeStringList(value.nice_to_have);

    return {
      summary,
      sections: {
        summary,
        responsibilities,
        nice_to_have: niceToHave,
      },
    };
  }

  throw new Error("Description is required");
};

const normalizeStringList = (value: string[] | string | undefined) => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === "string") {
    const normalized = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    return normalized.length ? normalized : undefined;
  }
  return undefined;
};

const normalizeSalary = (
  salary: SalaryInput | undefined,
  fallbackMin: unknown,
  fallbackMax: unknown,
  type: TypeJob
) => {
  if (type === "REFFERAL") {
    return { min: 0, max: 0 };
  }

  if (typeof salary === "number" || typeof salary === "string") {
    const numeric = sanitizeNumber(salary);
    if (numeric === undefined) {
      throw new Error("Salary is required");
    }
    return { min: numeric, max: numeric };
  }

  const minValue = sanitizeNumber(salary?.min ?? fallbackMin);
  const maxValue = sanitizeNumber(salary?.max ?? fallbackMax);

  if (minValue === undefined || maxValue === undefined) {
    throw new Error("Salary range (min & max) is required");
  }
  if (minValue < 0 || maxValue < 0) {
    throw new Error("Salary cannot be negative");
  }
  if (minValue > maxValue) {
    throw new Error("Minimum salary cannot exceed maximum salary");
  }

  return { min: minValue, max: maxValue };
};

const parseCreatePayload = (body: any): JobPayloadCreateModel => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const {
    description,
    until_at,
    location_id,
    is_published,
    salary,
    arrangement,
    commitment,
    show_salary,
    type_job,
    requirement,
    description_sections,
    is_have_domicile,
    user_id,
    step,
    is_draft,
    salary_min,
    salary_max,
    name,
    title,
  } = body;

  const isDraft = body?.is_draft === true;

  const rawJobTitle =
    typeof body?.job_title === "string"
      ? body.job_title.trim()
      : typeof title === "string"
      ? title.trim()
      : typeof name === "string"
      ? name.trim()
      : "";
  const rawJobRole =
    typeof body?.job_role === "string"
      ? body.job_role.trim()
      : typeof body?.role === "string"
      ? body.role.trim()
      : "";

  const jobTitle = rawJobTitle || (isDraft ? "Untitled Job" : "");
  const jobRole = rawJobRole || (isDraft ? jobTitle : "");

  if (!jobTitle) {
    throw new Error("Job title is required");
  }
  if (!jobRole) {
    throw new Error("Job role is required");
  }

  const normalizedLocationId =
    typeof location_id === "string"
      ? location_id
      : typeof body?.locationId === "string"
      ? body.locationId
      : undefined;
  if (!normalizedLocationId && !isDraft) {
    throw new Error("Location is required");
  }

  const rawUntilAt = until_at ?? body?.untilAt ?? body?.until;
  let untilAtDate: Date | null = null;
  if (rawUntilAt) {
    const candidate = new Date(rawUntilAt);
    if (!Number.isNaN(candidate.getTime())) {
      untilAtDate = candidate;
    }
  }
  if (!untilAtDate) {
    if (!isDraft) {
      throw new Error("Until_at is required");
    }
    untilAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const descriptionInput =
    description_sections ??
    description ??
    (isDraft ? { summary: jobTitle } : undefined);
  if (!descriptionInput) {
    throw new Error("Description is required");
  }
  const normalizedDescription = normalizeDescription(
    descriptionInput as DescriptionInput
  );

  const normalizedType = isTypeJob(type_job)
    ? type_job
    : ("TEAM_MEMBER" as TypeJob);
  const normalizedArrangement = isWorkType(arrangement)
    ? arrangement
    : ("ONSITE" as WorkType);
  const normalizedCommitment = isEmploymentType(commitment)
    ? commitment
    : ("FULL_TIME" as EmploymentType);

  let salaryRange: { min: number; max: number };
  try {
    salaryRange = normalizeSalary(
      salary as SalaryInput,
      salary_min,
      salary_max,
      normalizedType
    );
  } catch (error) {
    if (!isDraft) {
      throw error;
    }
    salaryRange = { min: 0, max: 0 };
  }

  const payload: JobPayloadCreateModel = {
    job_title: jobTitle,
    job_role: jobRole,
    description: normalizedDescription.summary,
    description_sections: normalizedDescription.sections,
    requirement:
      requirement && typeof requirement === "object"
        ? requirement
        : undefined,
    location_id: normalizedLocationId ?? undefined,
    until_at: untilAtDate,
    is_published: Boolean(is_published),
    salary_min: salaryRange.min,
    salary_max: salaryRange.max,
    type_job: normalizedType,
    arrangement: normalizedArrangement,
    commitment: normalizedCommitment,
    show_salary:
      normalizedType === "REFFERAL" ? false : Boolean(show_salary),
    is_have_domicile: Boolean(is_have_domicile),
    user_id: typeof user_id === "string" ? user_id : undefined,
    step: Number.isFinite(Number(step)) ? Number(step) : 0,
  };

  payload.is_draft = isDraft;

  return payload;
};

export const GET = async (req: NextRequest) => {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const filter =
      status === "active"
        ? { is_published: true }
        : status === "inactive"
        ? { is_published: false }
        : undefined;

    const includeDrafts = req.nextUrl.searchParams.get("draft") === "true";
    const userId = req.nextUrl.searchParams.get("user_id") || undefined;

    const data = await GET_JOBS(
      filter
        ? { ...filter, includeDrafts }
        : includeDrafts
        ? { includeDrafts: true }
        : undefined,
      userId
    );
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
        message:
          error instanceof Error ? error.message : "Failed to get job data",
      },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    let payload: JobPayloadCreateModel;
    try {
      payload = parseCreatePayload(body);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "Invalid create payload",
        },
        { status: 400 }
      );
    }

    const data = await CREATE_JOB(payload);

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

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 }
    );
  }
};

import dayjs from "dayjs";
import {
  JobDataModel,
  JobPayloadCreateModel,
  JobPayloadUpdateModel,
} from "@/app/models/job";

export const WORK_TYPE_OPTIONS = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const EMPLOYMENT_TYPE_OPTIONS = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
] as const;
export const TYPE_JOB_OPTIONS = ["TEAM_MEMBER", "REFFERAL"] as const;

export function buildJobPayload(
  values: JobDataModel
): JobPayloadCreateModel & JobPayloadUpdateModel {
  const until = values.until_at ? dayjs(values.until_at).toISOString() : null;
  if (!until) {
    throw new Error("Date is required");
  }

  const jobType =
    (values.type_job as (typeof TYPE_JOB_OPTIONS)[number]) ??
    TYPE_JOB_OPTIONS[0];

  const minSalary = Number(values.salary_min ?? values.salary_max ?? 0);
  const maxSalary = Number(values.salary_max ?? values.salary_min ?? 0);

  if (jobType === "TEAM_MEMBER") {
    if (!Number.isFinite(minSalary) || !Number.isFinite(maxSalary)) {
      throw new Error("Salary range is required");
    }
    if (minSalary > maxSalary) {
      throw new Error("Minimum salary cannot exceed maximum salary");
    }
    if (!values.arrangement) {
      throw new Error("Work arrangement is required");
    }
    if (!values.commitment) {
      throw new Error("Commitment type is required");
    }
  }

  const arrangementValue = values.arrangement ?? WORK_TYPE_OPTIONS[0];
  const commitmentValue =
    values.commitment ?? EMPLOYMENT_TYPE_OPTIONS[0];

  return {
    job_title: values.job_title,
    job_role: values.job_role,
    description: values.description,
    location_id: values.location_id,
    is_published: Boolean(values.is_published),
    salary_min: jobType === "REFFERAL" ? 0 : minSalary,
    salary_max: jobType === "REFFERAL" ? 0 : maxSalary,
    type_job: jobType,
    arrangement: arrangementValue,
    commitment: commitmentValue,
    show_salary:
      jobType === "REFFERAL" ? false : Boolean(values.show_salary),
    until_at: until,
    is_have_domicile: Boolean(values.is_have_domicile),
  } as JobPayloadCreateModel & JobPayloadUpdateModel;
}

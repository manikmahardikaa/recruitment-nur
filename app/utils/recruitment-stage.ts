import { RecruitmentStage } from "@prisma/client";
import { humanize } from "./humanize";

const StageEnum = RecruitmentStage as unknown as Record<string, string>;

// Resolve the canonical enum value for the "application" stage at runtime so
// the helpers stay compatible across environments that still expose the legacy
// `NEW_APLICANT` enum value.
const CANONICAL_APPLICATION_STAGE =
  StageEnum?.NEW_APPLICANT ?? StageEnum?.NEW_APLICANT ?? "NEW_APPLICANT";

// Resolve the canonical enum value for the "hiring" stage at runtime so the
// helpers stay compatible across environments that still expose the legacy
// `HIRED` enum value.
const CANONICAL_HIRING_STAGE =
  StageEnum?.HIRING ?? StageEnum?.HIRED ?? "HIRING";

export const PROGRESS_STAGE_ORDER = [
  "APPLICATION",
  "SCREENING",
  "INTERVIEW",
  "OFFERING",
  "HIRING",
  "REJECTED",
] as const;

export type ProgressStage = (typeof PROGRESS_STAGE_ORDER)[number];

const STAGE_LABELS: Record<string, string> = {
  APPLICATION: "Application",
  NEW_APPLICANT: "Application",
  NEW_APLICANT: "Application",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFERING: "Offering",
  HIRING: "Hiring",
  HIRED: "Hiring",
  REJECTED: "Rejected",
};

export const SUMMARY_STAGE_CONFIG = [
  { key: "screening", label: "Screening", stages: ["SCREENING"] },
  { key: "interview", label: "Interview", stages: ["INTERVIEW"] },
  { key: "offering", label: "Offering", stages: ["OFFERING"] },
  { key: "hired", label: "Hiring", stages: [CANONICAL_HIRING_STAGE] },
  { key: "rejected", label: "Rejected", stages: ["REJECTED"] },
] as const;

export type SummaryStageKey = (typeof SUMMARY_STAGE_CONFIG)[number]["key"];

export function normalizeStage(stage?: string | null) {
  return (stage ?? "").toString().trim().toUpperCase();
}

export function coerceStage(stage?: string | null) {
  const normalized = normalizeStage(stage);
  // Normalize historical/alternate names to the canonical enum used by Prisma.
  if (normalized === "NEW_APLICANT" || normalized === "NEW_APPLICANT") {
    return CANONICAL_APPLICATION_STAGE;
  }
  if (normalized === "HIRED" || normalized === "HIRING") {
    return CANONICAL_HIRING_STAGE;
  }
  return normalized;
}

export function toProgressStage(stage?: string | null): ProgressStage {
  const normalized = coerceStage(stage);
  switch (normalized) {
    case "SCREENING":
    case "INTERVIEW":
    case "OFFERING":
      return normalized;
    case CANONICAL_HIRING_STAGE:
      return "HIRING";
    case "REJECTED":
      return normalized;
    default:
      return "APPLICATION";
  }
}

export function getStageLabel(stage?: string | null) {
  const normalized = coerceStage(stage);
  if (normalized && STAGE_LABELS[normalized]) {
    return STAGE_LABELS[normalized];
  }
  const progressStage = toProgressStage(stage);
  if (STAGE_LABELS[progressStage]) return STAGE_LABELS[progressStage];
  const fallback = normalizeStage(stage);
  return fallback ? humanize(fallback) : STAGE_LABELS.APPLICATION;
}

export function stageMatches(
  stage: string | null | undefined,
  ...targets: string[]
) {
  const normalized = coerceStage(stage);
  if (!normalized) return false;
  return targets.some((target) => normalized === coerceStage(target));
}

export function stageKeyToStage(stageKey: string): string | undefined {
  const normalized = stageKey.toLowerCase();
  switch (normalized) {
    case "new_aplicant":
    case "new_applicant":
    case "application":
      return CANONICAL_APPLICATION_STAGE;
    case "screening":
      return "SCREENING";
    case "interview":
      return "INTERVIEW";
    case "offering":
      return "OFFERING";
    case "hired":
    case "hiring":
      return CANONICAL_HIRING_STAGE;
    case "rejected":
      return "REJECTED";
    default:
      return undefined;
  }
}

export function toRecruitmentStage(stage: string): RecruitmentStage {
  const normalized = normalizeStage(stage);
  const resolved =
    StageEnum?.[normalized] ??
    StageEnum?.[coerceStage(normalized)] ??
    normalized;
  return resolved as RecruitmentStage;
}

import { NextResponse } from "next/server";
import { generateJobDescription } from "@/app/vendor/generate-job-descriptions";
import { JobDescriptionPayload } from "@/app/models/job-description-payload";
import { GET_PROFILE_COMPANY_MERCHANT_ID } from "@/app/providers/profile-company";
import { GET_LOCATION } from "@/app/providers/location";

type RequestBody = {
  jobTitle: string;
  jobRole: string;
  location_id?: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  perks?: string[];
  tone?: JobDescriptionPayload["tone"];
  merchant_id?: string;
};

export async function POST(req: Request) {
  try {
    const {
      jobTitle,
      jobRole,
      location_id,
      responsibilities = [],
      requirements = [],
      skills = [],
      perks = [],
      tone,
      merchant_id,
    }: RequestBody = await req.json();

    const [company, location] = await Promise.all([
      merchant_id
        ? GET_PROFILE_COMPANY_MERCHANT_ID(merchant_id)
        : Promise.resolve(null),
      location_id ? GET_LOCATION(location_id) : Promise.resolve(null),
    ]);

    const payload: JobDescriptionPayload = {
      companyName: company?.company_name ?? "Perusahaan Kami",
      companySummary:
        company?.description ??
        "Perusahaan profesional yang melayani klien lokal dan internasional.",
      location: buildLocationLabel(location) ?? "Indonesia",
      position: jobRole || jobTitle || "Professional",
      responsibilities: normalizeList(responsibilities, jobRole),
      requirements: normalizeList(requirements, jobTitle),
      skills: skills.length ? skills : undefined,
      perks: perks.length ? perks : undefined,
      tone: tone ?? "professional",
    };

    const result = await generateJobDescription(payload);
    const normalizedSkills = Array.isArray(skills)
      ? skills.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    return NextResponse.json({
      result: injectSkillsSection(result, normalizedSkills),
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to generate job description ${error}` },
      { status: 500 },
    );
  }
}

function buildLocationLabel(
  location:
    | Awaited<ReturnType<typeof GET_LOCATION>>
    | null
    | undefined,
) {
  if (!location) {
    return null;
  }

  const parts = [
    location.address,
    location.district,
    location.province,
    location.country,
  ].filter(Boolean);

  return parts.join(", ");
}

function normalizeList(values: string[], fallback: string) {
  if (Array.isArray(values) && values.length > 0) {
    return values;
  }
  return [fallback].filter(Boolean);
}

function injectSkillsSection(description: string, skills: string[]) {
  if (!skills.length) {
    return description?.trim?.() ?? description;
  }

  const trimmed = description?.trim?.() ?? description;
  const lower = trimmed.toLowerCase();
  const hasSkillSection =
    lower.includes("keahlian yang dibutuhkan") ||
    lower.includes("skills & competencies");

  if (hasSkillSection) {
    return trimmed;
  }

  const sectionHeading = "## Keahlian yang Dibutuhkan";
  const skillDetails = skills
    .map(
      (skill) =>
        `- ${skill}: Kemampuan ${skill} yang dibutuhkan untuk menjalankan tanggung jawab utama secara efektif.`,
    )
    .join("\n");

  const section = `${sectionHeading}\n${skillDetails}`;
  const closingIndex = lower.lastIndexOf("tertarik");

  if (closingIndex !== -1) {
    const before = trimmed.slice(0, closingIndex).trimEnd();
    const after = trimmed.slice(closingIndex).trimStart();
    return `${before}\n\n${section}\n\n${after}`;
  }

  return `${trimmed}\n\n${section}`;
}

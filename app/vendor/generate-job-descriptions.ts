import { JobDescriptionPayload } from "../models/job-description-payload";



const CACHE_TTL_MS = 1000 * 60 * 10;
const OLLAMA_TIMEOUT_MS = 12_000;

const descriptionCache = new Map<
  string,
  { expiresAt: number; value: string }
>();

export async function generateJobDescription(
  payload: JobDescriptionPayload,
): Promise<string> {
  const cacheKey = JSON.stringify(payload).toLowerCase();
  const cached = descriptionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const description =
    (await fetchOllamaDescription(payload).catch(() => null)) ??
    buildFallbackDescription(payload);

  descriptionCache.set(cacheKey, {
    value: description,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return description;
}

async function fetchOllamaDescription(payload: JobDescriptionPayload) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing OLLAMA_BASE_URL");
  }

  const prompt = buildPrompt(payload);
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;

  const response = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        prompt,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 1024,
        },
      }),
    }),
    OLLAMA_TIMEOUT_MS,
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Ollama request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  const data = (await response.json()) as { response?: string };
  const text = (data.response ?? "").trim();
  if (!text) {
    throw new Error("Ollama returned empty description");
  }

  return text;
}

function buildPrompt({
  companyName,
  companySummary,
  location,
  position,
  responsibilities,
  requirements,
  perks = [],
  skills = [],
  tone = "professional",
}: JobDescriptionPayload) {
  const toneDescription =
    tone === "friendly"
      ? "professional yet friendly tone"
      : tone === "formal"
        ? "formal and objective tone"
        : "professional and inspiring tone";

  return `
You are an HR copywriting assistant. Write a clean job description in Indonesian using plain text only.
Do not use Markdown or code fences (no "#", no "\`\`\`", no "---").
Use short paragraphs and simple lists with "-" bullets. Keep each list item on one line.

Use this structure and order:
1) Company intro (2 paragraphs) based on the summary.
2) Position overview (1 paragraph).
3) Responsibilities (list).
4) Requirements (list).
5) Skills & competencies (list with brief explanations). Skip if no skills.
6) Perks/benefits (list). Skip if none.
7) Closing paragraph inviting candidates to apply.

Keep it concise, tidy, and in a ${toneDescription}.

Company: ${companyName}
Location: ${location}
Company summary: ${companySummary}
Position: ${position}

Responsibilities:
${responsibilities.join("\n")}

Requirements:
${requirements.join("\n")}

Skills / Competencies:
${skills.length ? skills.join("\n") : "None"}

Perks / Benefits:
${perks.length ? perks.join("\n") : "None"}

Return only the formatted description.
`;
}

function buildFallbackDescription({
  companyName,
  companySummary,
  location,
  position,
  responsibilities,
  requirements,
  perks = [],
  skills = [],
}: JobDescriptionPayload) {
  return `${position} - ${companyName}

Perusahaan:
${companySummary}

Lokasi: ${location}

Gambaran Pekerjaan:
Kami mencari ${position.toLowerCase()} yang siap mendukung pertumbuhan ${companyName}. Kandidat ideal adalah individu yang proaktif, teliti, dan nyaman bekerja dalam lingkungan yang dinamis.

Tanggung Jawab Utama:
${responsibilities.map((item) => `- ${item}`).join("\n")}

Kualifikasi:
${requirements.map((item) => `- ${item}`).join("\n")}

${
  skills.length
    ? `Keahlian yang Dibutuhkan:\n${skills
        .map(
          (item) =>
            `- ${item}: Kemampuan mendalam pada ${item} untuk mendukung keberhasilan peran.`,
        )
        .join("\n")}\n`
    : ""
}

${
  perks.length
    ? `Fasilitas Tambahan:\n${perks.map((item) => `- ${item}`).join("\n")}\n`
    : ""
}
Tertarik untuk berkembang bersama ${companyName}? Kirimkan lamaran Anda sekarang.`;
}

async function withTimeout<T>(promise: Promise<T>, timeout: number) {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Gemini request timeout"));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

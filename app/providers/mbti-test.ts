import db from "@/lib/prisma";
import { devilCreateTest } from "../utils/mbti-helper";

interface PayloadMbtiTest {
  user_id: string;
  applicant_id: string;
}

function assertNonEmptyString(
  value: unknown,
  name: string
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Field '${name}' wajib string dan tidak boleh kosong.`);
  }
}

export const GET_MBTI_TESTS = async () => {
  const result = await db.mbtiTest.findMany({});
  return result;
};

export const GET_MBTI_TEST = async (id: string) => {
  const result = await db.mbtiTest.findUnique({
    where: {
      id,
    },
  });
  return result;
};

export async function CREATE_MBTI_TEST(payload: PayloadMbtiTest) {
  // 1) Validasi manual
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload tidak valid.");
  }
  assertNonEmptyString(payload.user_id, "user_id");
  assertNonEmptyString(payload.applicant_id, "applicant_id");
  const APP_ORIGIN_RAW =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const API_ORIGIN_RAW =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const normalizeOrigin = (value: string) =>
    /^https?:\/\//i.test(value) ? value : `http://${value}`;

  const appOrigin = normalizeOrigin(APP_ORIGIN_RAW);
  const apiOrigin = normalizeOrigin(API_ORIGIN_RAW);
  const notifyUrl = new URL("/api/webhooks/mbti-complated", apiOrigin).toString();
  

  const user = await db.user.findUnique({
    where: {
      id: payload.user_id,
    },
  });

  // 2) Buat test di vendor eksternal
  const devilResp = await devilCreateTest({
    companyName: "OSS Bali",
    returnUrl: (() => {
      const url = new URL("/user/home/apply-job/detail", appOrigin);
      url.searchParams.set("applicant_id", payload.applicant_id);
      return url.toString();
    })(),
    notifyUrl,
    completedMessage: "Thank you for your time.",
    themeColor: "#004A9F",
    lang: "en",
    askGender: false,
    askAge: false,
    nameOfTester: user?.name,
  });
  const link = devilResp?.data?.test_url;
  const test_id = devilResp.data?.test_id;
  if (!link) {
    throw new Error(
      "Gagal membuat MBTI test: 'test_url' tidak tersedia dari penyedia eksternal."
    );
  }

  if (!test_id) {
    throw new Error(
      "Gagal membuat MBTI test: 'test_id' tidak tersedia dari penyedia eksternal."
    );
  }

  // 3) Transaksi Prisma: atomic create + update
  const saved = await db.$transaction(async (tx) => {
    // Cek applicant
    const applicant = await tx.applicant.findUnique({
      where: { id: payload.applicant_id },
      select: { id: true, mbti_test_id: true },
    });
    if (!applicant) {
      throw new Error(
        `Applicant dengan id '${payload.applicant_id}' tidak ditemukan.`
      );
    }
    if (applicant.mbti_test_id) {
      throw new Error("Applicant sudah memiliki MBTI test yang terhubung.");
    }

    // Buat mbtiTest
    const newTest = await tx.mbtiTest.create({
      data: {
        test_id: test_id,
        link_url: link,
      },
    });

    // Tautkan ke applicant
    await tx.applicant.update({
      where: { id: payload.applicant_id },
      data: { mbti_test_id: newTest.id },
    });

    return newTest;
  });

  return saved;
}

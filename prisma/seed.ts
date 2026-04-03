import {
  PrismaClient,
  Role,
  WorkType,
  EmploymentType,
  TypeJob,
  LocationType,
  RecruitmentStage,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@demo.local" },
    update: {
      name: "Admin Demo",
      password: passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: "admin@demo.local",
      name: "Admin Demo",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const candidate1 = await db.user.upsert({
    where: { email: "candidate1@demo.local" },
    update: { name: "Candidate One", password: passwordHash },
    create: {
      email: "candidate1@demo.local",
      name: "Candidate One",
      password: passwordHash,
      role: Role.CANDIDATE,
    },
  });

  const candidate2 = await db.user.upsert({
    where: { email: "candidate2@demo.local" },
    update: { name: "Candidate Two", password: passwordHash },
    create: {
      email: "candidate2@demo.local",
      name: "Candidate Two",
      password: passwordHash,
      role: Role.CANDIDATE,
    },
  });

  const candidate3 = await db.user.upsert({
    where: { email: "candidate3@demo.local" },
    update: { name: "Candidate Three", password: passwordHash },
    create: {
      email: "candidate3@demo.local",
      name: "Candidate Three",
      password: passwordHash,
      role: Role.CANDIDATE,
    },
  });

  const merchant1 = await db.merchant.upsert({
    where: { id: "mch_001" },
    update: { name: "Merchant Alpha" },
    create: { id: "mch_001", name: "Merchant Alpha" },
  });

  const merchant2 = await db.merchant.upsert({
    where: { id: "mch_002" },
    update: { name: "Merchant Beta" },
    create: { id: "mch_002", name: "Merchant Beta" },
  });

  const location1 = await db.location.upsert({
    where: { id: "loc_001" },
    update: {
      name: "HQ Alpha",
      maps_url: "https://maps.example.com/alpha",
      type: LocationType.HEAD_OFFICE,
      address: "Jl. Merdeka No. 1",
      district: "Makassar",
      province: "Sulawesi Selatan",
      country: "Indonesia",
      user_id: admin.id,
    },
    create: {
      id: "loc_001",
      name: "HQ Alpha",
      maps_url: "https://maps.example.com/alpha",
      type: LocationType.HEAD_OFFICE,
      address: "Jl. Merdeka No. 1",
      district: "Makassar",
      province: "Sulawesi Selatan",
      country: "Indonesia",
      user_id: admin.id,
    },
  });

  const location2 = await db.location.upsert({
    where: { id: "loc_002" },
    update: {
      name: "Branch Beta",
      maps_url: "https://maps.example.com/beta",
      type: LocationType.BRANCH_OFFICE,
      address: "Jl. Sudirman No. 20",
      district: "Makassar",
      province: "Sulawesi Selatan",
      country: "Indonesia",
      user_id: admin.id,
    },
    create: {
      id: "loc_002",
      name: "Branch Beta",
      maps_url: "https://maps.example.com/beta",
      type: LocationType.BRANCH_OFFICE,
      address: "Jl. Sudirman No. 20",
      district: "Makassar",
      province: "Sulawesi Selatan",
      country: "Indonesia",
      user_id: admin.id,
    },
  });

  const job1 = await db.job.upsert({
    where: { id: "job_001" },
    update: {
      job_title: "Frontend Engineer",
      job_role: "Frontend Engineer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      description: "Build and maintain web interfaces for our products.",
      salary_min: 6000000,
      salary_max: 9000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.HYBRID,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: false,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 1,
      user_id: admin.id,
      merchant_id: merchant1.id,
      location_id: location1.id,
    },
    create: {
      id: "job_001",
      job_title: "Frontend Engineer",
      job_role: "Frontend Engineer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      description: "Build and maintain web interfaces for our products.",
      salary_min: 6000000,
      salary_max: 9000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.HYBRID,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: false,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 1,
      user_id: admin.id,
      merchant_id: merchant1.id,
      location_id: location1.id,
    },
  });

  const job2 = await db.job.upsert({
    where: { id: "job_002" },
    update: {
      job_title: "Backend Engineer",
      job_role: "Backend Engineer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      description: "Build scalable APIs and backend services.",
      salary_min: 7000000,
      salary_max: 11000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.ONSITE,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: true,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 2,
      user_id: admin.id,
      merchant_id: merchant1.id,
      location_id: location1.id,
    },
    create: {
      id: "job_002",
      job_title: "Backend Engineer",
      job_role: "Backend Engineer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      description: "Build scalable APIs and backend services.",
      salary_min: 7000000,
      salary_max: 11000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.ONSITE,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: true,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 2,
      user_id: admin.id,
      merchant_id: merchant1.id,
      location_id: location1.id,
    },
  });

  const job3 = await db.job.upsert({
    where: { id: "job_003" },
    update: {
      job_title: "UI/UX Designer",
      job_role: "UI/UX Designer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      description: "Design delightful user experiences.",
      salary_min: 5500000,
      salary_max: 8000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.REMOTE,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: false,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 1,
      user_id: admin.id,
      merchant_id: merchant2.id,
      location_id: location2.id,
    },
    create: {
      id: "job_003",
      job_title: "UI/UX Designer",
      job_role: "UI/UX Designer",
      until_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      description: "Design delightful user experiences.",
      salary_min: 5500000,
      salary_max: 8000000,
      type_job: TypeJob.TEAM_MEMBER,
      arrangement: WorkType.REMOTE,
      commitment: EmploymentType.FULL_TIME,
      is_have_domicile: false,
      is_draft: false,
      show_salary: true,
      is_published: true,
      step: 1,
      user_id: admin.id,
      merchant_id: merchant2.id,
      location_id: location2.id,
    },
  });

  await db.applicant.upsert({
    where: { id: "app_001" },
    update: {
      user_id: candidate1.id,
      job_id: job1.id,
      merchant_id: merchant1.id,
      stage: RecruitmentStage.SCREENING,
    },
    create: {
      id: "app_001",
      user_id: candidate1.id,
      job_id: job1.id,
      merchant_id: merchant1.id,
      stage: RecruitmentStage.SCREENING,
    },
  });

  await db.applicant.upsert({
    where: { id: "app_002" },
    update: {
      user_id: candidate2.id,
      job_id: job2.id,
      merchant_id: merchant1.id,
      stage: RecruitmentStage.INTERVIEW,
    },
    create: {
      id: "app_002",
      user_id: candidate2.id,
      job_id: job2.id,
      merchant_id: merchant1.id,
      stage: RecruitmentStage.INTERVIEW,
    },
  });

  await db.applicant.upsert({
    where: { id: "app_003" },
    update: {
      user_id: candidate3.id,
      job_id: job3.id,
      merchant_id: merchant2.id,
      stage: RecruitmentStage.OFFERING,
    },
    create: {
      id: "app_003",
      user_id: candidate3.id,
      job_id: job3.id,
      merchant_id: merchant2.id,
      stage: RecruitmentStage.OFFERING,
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

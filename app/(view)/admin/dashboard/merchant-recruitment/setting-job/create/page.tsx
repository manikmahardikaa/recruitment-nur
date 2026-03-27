"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const CreateJobContent = lazy(() => import("./content"));

export default function CreateJobPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; merchant_id?: string };
}) {
  const jobId =
    typeof searchParams?.jobId === "string" ? searchParams.jobId : undefined;
  const merchantId =
    typeof searchParams?.merchant_id === "string"
      ? searchParams.merchant_id
      : undefined;
  return (
    <Suspense fallback={<Loading />}>
      <CreateJobContent jobId={jobId} merchantId={merchantId} />
    </Suspense>
  );
}

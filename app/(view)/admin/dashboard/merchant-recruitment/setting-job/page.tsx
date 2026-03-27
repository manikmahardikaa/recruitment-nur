"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const SettingJobContent = lazy(() => import("./content"));

export const dynamic = "force-dynamic";

export default function SettingJob() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingJobContent />
    </Suspense>
  );
}

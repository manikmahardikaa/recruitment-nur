"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const ScreeningContent = lazy(() => import("./content"));

export default function Screening() {
  return (
    <Suspense fallback={<Loading />}>
      <ScreeningContent />
    </Suspense>
  );
}

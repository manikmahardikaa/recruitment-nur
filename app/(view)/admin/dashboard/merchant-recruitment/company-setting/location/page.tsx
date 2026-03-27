"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const LocationContent = lazy(() => import("./content"));

export default function Location() {
  return (
    <Suspense fallback={<Loading />}>
      <LocationContent />
    </Suspense>
  );
}

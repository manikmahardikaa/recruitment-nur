"use client";

import { Suspense, lazy } from "react";

const InterviewContent = lazy(() => import("./content"));

export default function Interview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewContent />
    </Suspense>
  );
}

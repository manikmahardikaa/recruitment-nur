'use client'

import { Suspense, lazy } from "react"
const RejectedContent = lazy(() => import("./content"));

export default function Rejected() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RejectedContent />
    </Suspense>
  );
}
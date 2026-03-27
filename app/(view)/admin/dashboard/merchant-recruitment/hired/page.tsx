"use client";

import { Suspense, lazy } from "react";
const HiredContent = lazy(() => import("./content"));

export default function Hired() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HiredContent />
    </Suspense>
  );
}

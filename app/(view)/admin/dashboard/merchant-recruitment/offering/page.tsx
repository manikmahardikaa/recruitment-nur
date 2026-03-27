"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const Content = lazy(() => import("./content"));

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

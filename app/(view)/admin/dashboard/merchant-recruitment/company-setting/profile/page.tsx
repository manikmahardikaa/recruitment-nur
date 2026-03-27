"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const Content = lazy(() => import("./content"));
export default function Page({
  searchParams,
}: {
  searchParams?: { merchant_id?: string };
}) {
  const merchantId =
    typeof searchParams?.merchant_id === "string"
      ? searchParams.merchant_id
      : undefined;
  return (
    <Suspense fallback={<Loading />}>
      <Content merchantId={merchantId} />
    </Suspense>
  );
}

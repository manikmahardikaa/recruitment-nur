"use client"

import { Suspense, lazy } from "react";
import Loading from "@/app/components/common/custom-loading";
const ListMerchantComponent = lazy(() => import("./content"));

export default function ListMerchant() {
    return <Suspense fallback={<Loading />}>
        <ListMerchantComponent />
    </Suspense>
}
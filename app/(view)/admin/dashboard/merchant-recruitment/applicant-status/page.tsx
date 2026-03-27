"use client";

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const RecruitmentContent = lazy(() => import("./content"));

export default function Recruitment() {
    return (
        <Suspense fallback={<Loading />}>
            <RecruitmentContent />
        </Suspense>
    );
}

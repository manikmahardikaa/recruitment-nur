"use client"

import Loading from "@/app/components/common/custom-loading";
import { Suspense, lazy } from "react";

const DetailCandidateContent = lazy(() => import("./content"));

export default function DetailCandidate() {
    return (
        <Suspense fallback={<Loading />}>
            <DetailCandidateContent />
        </Suspense>
    );
}
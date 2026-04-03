import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import DetailCandidateContent from "./content";

export default function DetailCandidate() {
    return (
        <Suspense fallback={<Loading />}>
            <DetailCandidateContent />
        </Suspense>
    );
}

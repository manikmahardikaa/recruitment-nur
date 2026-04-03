import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import RecruitmentContent from "./content";

export default function Recruitment() {
    return (
        <Suspense fallback={<Loading />}>
            <RecruitmentContent />
        </Suspense>
    );
}

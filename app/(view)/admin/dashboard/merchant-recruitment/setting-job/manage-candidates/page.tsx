import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import Content from "./content";
export default function ManageCandidate() {
    return (
        <Suspense fallback={<Loading />}>
            <Content />
        </Suspense>
    );
}

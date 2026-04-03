import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import ScreeningContent from "./content";

export default function Screening() {
  return (
    <Suspense fallback={<Loading />}>
      <ScreeningContent />
    </Suspense>
  );
}

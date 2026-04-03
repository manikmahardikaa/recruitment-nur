import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import SettingJobContent from "./content";

export const dynamic = "force-dynamic";

export default function SettingJob() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingJobContent />
    </Suspense>
  );
}

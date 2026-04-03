import Loading from "@/app/components/common/custom-loading";
import { Suspense } from "react";
import ProfileContent from "./content";

export default function Profile() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import RejectedContent from "./content";

export default function Rejected() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RejectedContent />
    </Suspense>
  );
}

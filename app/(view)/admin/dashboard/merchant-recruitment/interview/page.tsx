import { Suspense } from "react";
import InterviewContent from "./content";

export default function Interview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewContent />
    </Suspense>
  );
}

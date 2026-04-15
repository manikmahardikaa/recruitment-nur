import { Suspense } from "react";
import OfferingContent from "./content";

export default function Offering() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfferingContent />
    </Suspense>
  );
}

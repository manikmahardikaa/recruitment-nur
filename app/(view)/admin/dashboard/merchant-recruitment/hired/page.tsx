import { Suspense } from "react";
import HiredContent from "./content";

export default function Hired() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HiredContent />
    </Suspense>
  );
}

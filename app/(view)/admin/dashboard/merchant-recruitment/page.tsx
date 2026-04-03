import { Suspense } from "react";
import Loading from "@/app/components/common/custom-loading";
import ListMerchantComponent from "./content";

export default function ListMerchant() {
    return <Suspense fallback={<Loading />}>
        <ListMerchantComponent />
    </Suspense>
}

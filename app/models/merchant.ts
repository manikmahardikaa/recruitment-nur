/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Prisma } from "@prisma/client";

export type MerchantDataModel = Prisma.MerchantGetPayload<{
  include: {
    _count: {
      select: {
        jobs: true;
        applicants: true;
      };
    };
  };
}>;


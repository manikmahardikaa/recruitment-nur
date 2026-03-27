/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Prisma } from "@prisma/client";
import { GeneralOmitModel } from "./general-omit";

export type ApplicantDataModel = Prisma.ApplicantGetPayload<{
  include: {
    merchant: true;
    job: {
      include: {
        location: true;
      };
    };
    user: true;
  };
}>;

export interface ApplicantPayloadCreateModel
  extends Prisma.ApplicantUncheckedCreateInput {}

export interface ApplicantPayloadUpdateModel extends Omit<
  Prisma.ApplicantUncheckedUpdateInput,
  GeneralOmitModel
> {}

export interface ApplicantFormModel extends Omit<
  ApplicantDataModel,
  GeneralOmitModel
> {}

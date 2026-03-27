/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Prisma, Job, Location, Merchant } from "@prisma/client";
import { GeneralOmitModel } from "./general-omit";

export type JobStats = {
  chatStarted: number;
  connected: number;
  notSuitable: number;
};

export interface JobDataModel extends Job {
  location: Location | null;
  merchant?: Merchant | null;
  stats?: JobStats;
}

export interface JobPayloadCreateModel
  extends Prisma.JobUncheckedCreateInput {}

export interface JobPayloadUpdateModel
  extends Omit<Prisma.JobUncheckedUpdateInput, GeneralOmitModel> {}

export interface JobFormModel extends Omit<JobDataModel, GeneralOmitModel> {}

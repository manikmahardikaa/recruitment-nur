import { Prisma, User } from "@prisma/client";
import { GeneralOmitModel } from "./general-omit";

export type UserInterestTagModel = {
  interest?: string;
};

export interface UserDataModel extends User {
  interestTags?: UserInterestTagModel[];
}

export type UserPayloadCreateModel = Omit<
  Prisma.UserUncheckedCreateInput,
  "interestTags"
> & {
  interestTags?: string[];
};

export type UserPayloadUpdateModel = Omit<
  Prisma.UserUncheckedUpdateInput,
  GeneralOmitModel | "interestTags"
> & {
  interestTags?: string[];
};

export interface UserFormModel extends Omit<UserDataModel, GeneralOmitModel> {}

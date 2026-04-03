import { Prisma, User } from "@prisma/client";
import { GeneralOmitModel } from "./general-omit";

export interface UserDataModel extends User {}

export type UserPayloadCreateModel = Prisma.UserUncheckedCreateInput;

export type UserPayloadUpdateModel = Omit<
  Prisma.UserUncheckedUpdateInput,
  GeneralOmitModel
>;

export interface UserFormModel extends Omit<UserDataModel, GeneralOmitModel> {}

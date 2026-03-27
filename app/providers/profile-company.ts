import { db } from "@/lib/prisma";
import {
  ProfileCompanyPayloadCreateModel,
  ProfileCompanyPayloadUpdateModel,
} from "../models/profile-company";

export const GET_PROFILE_COMPANY_USER_ID = async (id: string) => {
  const result = await db.profileCompany.findFirst({
    where: {
      user_id: id,
    },
  });
  return result;
};

export const GET_PROFILE_COMPANY_MERCHANT_ID = async (id: string) => {
  const result = await db.profileCompany.findFirst({
    where: {
      merchant_id: id,
    },
  });
  return result;
};

export const CREATE_PROFILE_COMPANY = async (
  payload: ProfileCompanyPayloadCreateModel
) => {
  const result = await db.profileCompany.create({
    data: payload,
  });

  return result;
};

export const UPDATE_PROFILE_COMPANY = async (
  id: string,
  payload: ProfileCompanyPayloadUpdateModel
) => {
  const result = await db.profileCompany.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

export const DELETE_PROFILE_COMPANY = async (id: string) => {
  const result = await db.profileCompany.delete({
    where: {
      id,
    },
  });
  return result;
};

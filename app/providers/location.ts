import { db } from "@/lib/prisma";
import {
  LocationPayloadCreateModel,
  LocationPayloadUpdateModel,
} from "../models/location";

export const GET_LOCATIONS = async (params?: {
  merchant_id?: string;
  user_id?: string;
}) => {
  const result = await db.location.findMany({
    where: {
      ...(params?.merchant_id ? { merchant_id: params.merchant_id } : {}),
      ...(params?.user_id ? { user_id: params.user_id } : {}),
    },
  });
  return result;
};

export const GET_LOCATION = async (id: string) => {
  const result = await db.location.findUnique({
    where: {
      id,
    },
  });
  return result;
};

export const GET_LOCATION_BY_USER_ID = async (user_id: string) => {
  const result = await db.location.findMany({
    where: {
      user_id,
    },
  });
  return result;
}

export const GET_LOCATION_BY_MERCHANT_ID = async (merchant_id: string) => {
  const result = await db.location.findMany({
    where: {
      merchant_id,
    },
  });
  return result;
};

export const CREATE_LOCATION = async (payload: LocationPayloadCreateModel) => {
  const result = await db.location.create({
    data: payload,
  });

  return result;
};

export const UPDATE_LOCATION = async (
  id: string,
  payload: LocationPayloadUpdateModel
) => {
  const result = await db.location.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

export const DELETE_LOCATION = async (id: string) => {
  const result = await db.location.delete({
    where: {
      id,
    },
  });
  return result;
};

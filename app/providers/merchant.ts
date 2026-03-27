import { db } from "@/lib/prisma";

export const GET_MERCHANTS = async () => {
  const merchants = await db.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          jobs: true,
          applicants: true,
        },
      },
    },
  });

  return merchants;
};

export const CREATE_MERCHANT = async (name: string) => {
  const merchant = await db.merchant.create({
    data: { name },
  });
  return merchant;
};

export const UPDATE_MERCHANT = async (id: string, name: string) => {
  const merchant = await db.merchant.update({
    where: { id },
    data: { name },
  });
  return merchant;
};

export const DELETE_MERCHANT = async (id: string) => {
  const merchant = await db.merchant.delete({
    where: { id },
  });
  return merchant;
};

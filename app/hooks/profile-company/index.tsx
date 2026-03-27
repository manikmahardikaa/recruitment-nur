import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import MainNotification from "../../components/common/notifications";
import {
  ProfileCompanyDataModel,
  ProfileCompanyPayloadCreateModel,
  ProfileCompanyPayloadUpdateModel,
} from "@/app/models/profile-company";

const baseUrl = "/api/admin/dashboard/profile-company";
const entity = "profile company";
const queryKey = "profile-companys";

export const useProfileCompanys = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: ProfileCompanyPayloadCreateModel) =>
      axios.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      MainNotification({ type: "success", entity, action: "created" });
    },
    onError: () => {
      MainNotification({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string) => axios.delete(`${baseUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      MainNotification({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      MainNotification({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    onDelete,
    onDeleteLoading,
    onCreate,
    onCreateLoading,
  };
};

export const useProfileCompany = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ProfileCompanyPayloadUpdateModel;
    }) => axios.put(`${baseUrl}/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      MainNotification({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      MainNotification({ type: "error", entity, action: "updated" });
    },
  });

  return {
    onUpdate,
    onUpdateLoading,
  };
};

export const useProfileCompanyByUserId = ({ id }: { id?: string }) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await axios.get(
        `${baseUrl}/profile-company-by-userId?userId=${id}`
      );
      return result.data.result as ProfileCompanyDataModel;
    },
    enabled: Boolean(id),
  });

  return {
    data,
    fetchLoading,
  };
};

export const useProfileCompanyByMerchantId = ({ id }: { id?: string }) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, "merchant", id],
    queryFn: async () => {
      const result = await axios.get(
        `${baseUrl}/profile-company-by-merchantId?merchantId=${id}`
      );
      return result.data.result as ProfileCompanyDataModel;
    },
    enabled: Boolean(id),
  });

  return {
    data,
    fetchLoading,
  };
};

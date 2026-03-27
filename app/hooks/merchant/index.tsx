import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { MerchantDataModel } from "@/app/models/merchant";

const baseUrl = "/api/admin/dashboard/merchant";
const queryKey = "merchants";

export const useMerchants = () => {
  const queryClient = useQueryClient();
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const result = await axios.get(baseUrl);
      return result.data.result as MerchantDataModel[];
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: { name: string }) => axios.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string) => axios.delete(`${baseUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    data,
    fetchLoading,
    onCreate,
    onCreateLoading,
    onDelete,
    onDeleteLoading,
  };
};

export const useMerchant = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: { name: string }) =>
      axios.put(`${baseUrl}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    onUpdate,
    onUpdateLoading,
  };
};

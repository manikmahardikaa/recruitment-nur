import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import MainNotification from "../../components/common/notifications";
import {
  JobDataModel,
  JobPayloadCreateModel,
  JobPayloadUpdateModel,
} from "@/app/models/job";

const baseUrl = "/api/admin/dashboard/job";
const entity = "job";
const queryKey = "jobs";

export const useJobs = ({ queryString }: { queryString?: string }) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const result = await axios.get(url);
      return result.data.result as JobDataModel[];
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: JobPayloadCreateModel) =>
      axios.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      // MainNotification({ type: "success", entity, action: "created" });
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
    // onError: () => {
    //   MainNotification({ type: "error", entity, action: "deleted" });
    // },
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

export const useJob = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await axios.get(`${baseUrl}/${id}`);
      return result.data.result as JobDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: JobPayloadUpdateModel;
    }) => axios.put(`${baseUrl}/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      // MainNotification({ type: "success", entity, action: "updated" });
    },
    // onError: () => {
    //   MainNotification({ type: "error", entity, action: "updated" });
    // },
  });

  const { mutateAsync: onPublish, isPending: onPublishLoading } = useMutation({
    mutationFn: async (jobId: string) =>
      axios.post(`${baseUrl}/publish`, { id: jobId }),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, jobId] });
      MainNotification({ type: "success", entity, action: "published" });
    },
    onError: () => {
      MainNotification({ type: "error", entity, action: "published" });
    },
  });

  return {
    data,
    fetchLoading,
    onUpdate,
    onUpdateLoading,
    onPublish,
    onPublishLoading,
  };
};

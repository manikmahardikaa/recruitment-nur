import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import MainNotification from "../../components/common/notifications";
import {
  ApplicantDataModel,
  ApplicantPayloadCreateModel,
} from "@/app/models/applicant";
import { RecruitmentStage } from "@prisma/client";

const baseUrl = "/api/admin/dashboard/applicant";
const entity = "applicant";
const queryKey = "applicants";

export const useCandidates = ({
  queryString,
  disableNotification,
}: {
  queryString?: string;
  disableNotification?: boolean;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const result = await axios.get(url);
      return result.data.result as ApplicantDataModel[];
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: ApplicantPayloadCreateModel) =>
      axios.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (!disableNotification) {
        MainNotification({ type: "success", entity, action: "created" });
      }
    },
    onError: (error) => {
      if (disableNotification) return;
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | { details?: string; message?: string }
          | undefined;
        const details = data?.details || data?.message;
        MainNotification({
          type: "error",
          entity,
          action: "created",
          description: details,
        });
        return;
      }
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
    data,
    fetchLoading,
    onDelete,
    onDeleteLoading,
    onCreate,
    onCreateLoading,
  };
};

export const useCandidate = ({ id }: { id?: string }) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await axios.get(`${baseUrl}/${id}`);
      return result.data.result as ApplicantDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdateStatus, isPending: onUpdateStatusLoading } =
    useMutation({
      mutationFn: async ({
        id,
        stage,
      }: {
        id: string;
        stage: RecruitmentStage;
      }) => {
        return axios.patch(`${baseUrl}/${id}`, { stage });
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
        MainNotification({
          type: "success",
          entity,
          action: "updated status",
        });
      },
      onError: () => {
        MainNotification({ type: "error", entity, action: "updated status" });
      },
    });

  return {
    onUpdateStatus,
    onUpdateStatusLoading,
    data,
    fetchLoading,
  };
};

export const useCandidateByUserId = ({ id }: { id?: string }) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await axios.get(
        `${baseUrl}/applicant-by-userId?userId=${id}`
      );
      return result.data.result as ApplicantDataModel[];
    },
    enabled: Boolean(id),
  });

  return {
    data,
    fetchLoading,
  };
};

export const useCandidateByJobId = ({ id }: { id?: string }) => {
  const { data, isLoading: fetchLoading, error } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await axios.get(
        `${baseUrl}/applicant-by-jobId?job_id=${id}`
      );
      return result.data.result as ApplicantDataModel[];
    },
    enabled: Boolean(id),
  });

  return {
    data,
    fetchLoading,
    error,
  };
};

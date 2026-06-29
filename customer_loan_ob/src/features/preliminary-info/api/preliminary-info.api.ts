import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  PreliminaryInfoPayload,
  PreliminaryInfoResponse,
} from "../types/preliminary-info.type";

export const preliminaryInfoApi = {
  saveDraft: async (
    payload: PreliminaryInfoPayload,
  ): Promise<PreliminaryInfoResponse> => {
    return axiosClient.post<
      PreliminaryInfoResponse,
      PreliminaryInfoResponse,
      PreliminaryInfoPayload
    >(API_ENDPOINTS.preliminaryInfo.saveDraft, payload);
  },

  submit: async (
    payload: PreliminaryInfoPayload,
  ): Promise<PreliminaryInfoResponse> => {
    return axiosClient.post<
      PreliminaryInfoResponse,
      PreliminaryInfoResponse,
      PreliminaryInfoPayload
    >(API_ENDPOINTS.preliminaryInfo.submit, payload);
  },
};
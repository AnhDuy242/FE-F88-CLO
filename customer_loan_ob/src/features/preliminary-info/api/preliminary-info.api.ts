import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

import type {
  ApiResponse,
  CreateLoanApplicationPayload,
  LoanApplicationDraftData,
  SaveLoanApplicationDraftPayload,
  StepCompletionData,
} from "@/features/preliminary-info/types/preliminary-info.type";

export type LoanApplicationDraftResponse =
  ApiResponse<LoanApplicationDraftData>;

export type StepCompletionResponse = ApiResponse<StepCompletionData>;

export const preliminaryInfoApi = {
  createLoanApplicationDraft: async (
    payload: CreateLoanApplicationPayload,
  ): Promise<LoanApplicationDraftResponse> => {
    return axiosClient.post<
      LoanApplicationDraftResponse,
      LoanApplicationDraftResponse
    >(API_ENDPOINTS.loanApplication.createDraft, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  },

  saveDraft: async (
    applicationCode: string,
    payload: SaveLoanApplicationDraftPayload,
  ): Promise<LoanApplicationDraftResponse> => {
    return axiosClient.patch<
      LoanApplicationDraftResponse,
      LoanApplicationDraftResponse
    >(
      API_ENDPOINTS.preliminaryInfo.saveDraft(applicationCode),
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },

  completePreliminaryStep: async (
    applicationCode: string,
  ): Promise<StepCompletionResponse> => {
    return axiosClient.post<StepCompletionResponse, StepCompletionResponse>(
      API_ENDPOINTS.preliminaryInfo.submit(applicationCode),
      undefined,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },

  submit: async (applicationCode: string): Promise<StepCompletionResponse> => {
    return preliminaryInfoApi.completePreliminaryStep(applicationCode);
  },
};

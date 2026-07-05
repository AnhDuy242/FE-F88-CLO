import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

import type {
  FinalLoanOfferResponse,
  FinalLoanOfferPreviewPayload,
  LoanProductRecommendationPayload,
  LoanProductRecommendationResponse,
  SelectFinalLoanOfferPayload,
} from "@/features/preliminary-info/types/loan-product-recommendation.type";

export type ApplicationLoanProductRecommendationPayload = {
  deductionItems?: {
    type: string;
    rate: number;
  }[];
  scoreGrade?: string;
  limit?: number;
};

export const loanProductRecommendationApi = {
  recommend: async (
    payload: LoanProductRecommendationPayload,
  ): Promise<LoanProductRecommendationResponse> => {
    return axiosClient.post<
      LoanProductRecommendationResponse,
      LoanProductRecommendationResponse
    >(API_ENDPOINTS.loanProductRecommendation.recommend, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  },

  recommendByApplication: async (
    applicationCode: string,
    payload: ApplicationLoanProductRecommendationPayload = {},
  ): Promise<LoanProductRecommendationResponse> => {
    return axiosClient.post<
      LoanProductRecommendationResponse,
      LoanProductRecommendationResponse
    >(
      API_ENDPOINTS.loanProductRecommendation.recommendByApplication(
        applicationCode,
      ),
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },

  previewFinalOffer: async (
    applicationCode: string,
    payload: FinalLoanOfferPreviewPayload = {},
  ): Promise<FinalLoanOfferResponse> => {
    return axiosClient.post<FinalLoanOfferResponse, FinalLoanOfferResponse>(
      API_ENDPOINTS.loanProductRecommendation.previewFinalOffer(applicationCode),
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },

  selectFinalOffer: async (
    applicationCode: string,
    payload: SelectFinalLoanOfferPayload,
  ): Promise<FinalLoanOfferResponse> => {
    return axiosClient.post<FinalLoanOfferResponse, FinalLoanOfferResponse>(
      API_ENDPOINTS.loanProductRecommendation.selectFinalOffer(applicationCode),
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },
};

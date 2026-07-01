import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  LoanProductRecommendationPayload,
  LoanProductRecommendationResponse,
} from "../types/loan-product-recommendation.type";

export const loanProductRecommendationApi = {
  recommend: async (
    applicationCode: string,
    payload: LoanProductRecommendationPayload,
  ): Promise<LoanProductRecommendationResponse> => {
    return axiosClient.post<
      LoanProductRecommendationResponse,
      LoanProductRecommendationResponse,
      LoanProductRecommendationPayload
    >(
      API_ENDPOINTS.loanProductRecommendation.recommend(applicationCode),
      payload,
    );
  },
};
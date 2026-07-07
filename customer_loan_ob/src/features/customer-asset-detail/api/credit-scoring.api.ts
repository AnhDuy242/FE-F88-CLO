import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

export type CreditScoringCalculatePayload = {
  ruleSetCode?: string;
  monthlyIncomeAmount: number;
  age: number;
  dependentCount: number;
};

export type CreditScoringComponent = {
  component?: string;
  inputValue?: number;
  scoreValue?: number;
  weight?: number;
  weightedScore?: number;
  displayLabel?: string;
};

export type CreditScoringCalculateData = {
  ruleSetCode?: string;
  totalScore?: number;
  scoreGrade?: string;
  scoreGradeLabel?: string;
  components?: CreditScoringComponent[];
};

export type CreditScoringCalculateResponse = {
  success?: boolean;
  message?: string;
  data?: CreditScoringCalculateData;
  errorCode?: string | null;
  timestamp?: string;
};

export const creditScoringApi = {
  calculate: async (
    payload: CreditScoringCalculatePayload,
  ): Promise<CreditScoringCalculateResponse> => {
    return axiosClient.post<
      CreditScoringCalculateResponse,
      CreditScoringCalculateResponse
    >(API_ENDPOINTS.creditScoring.calculate, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  },
};

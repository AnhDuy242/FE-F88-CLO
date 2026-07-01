import type { AssetTypeApiValue } from "./asset-valuation.type";

export type LoanProductRecommendationPayload = {
  selectedLoanPurpose: string;
  selectedAssetType: AssetTypeApiValue;
  selectedTenor: number;
  requestedLoanAmount: number;
  adjustedAssetValue: number;
  scoreGrade: string;
};

export type LoanProductRecommendationProduct = {
  rank: number;
  productCode: string;
  productName: string;
  minLoanAmount: number;
  productMaxLoanAmount: number;
  maxLtvPercent: number;
  maxLoanByLtv: number;
  effectiveMaxLoanAmount: number;
  suggestedLoanAmount: number;
  loanTenor: number;
  monthlyInterestRatePercent: number;
  principalPerMonth: number;
  interestPerMonth: number;
  estimatedMonthlyPayment: number;
  recommended: boolean;
};

export type LoanProductRecommendationData = {
  recommendedProductCode: string;
  products: LoanProductRecommendationProduct[];
};

export type LoanProductRecommendationResponse = {
  success?: boolean;
  message?: string;
  data?: LoanProductRecommendationData;
  errorCode?: string | null;
  timestamp?: string;
};
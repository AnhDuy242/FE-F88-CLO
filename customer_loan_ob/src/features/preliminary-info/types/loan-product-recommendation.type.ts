export type LoanProductRecommendationPayload = {
  selectedLoanPurpose: string;
  selectedAssetType: "MOTORBIKE" | "CAR";
  selectedTenor: number;
  requestedLoanAmount: number;
  adjustedAssetValue: number;
  scoreGrade: string;
};

export type LoanProductRecommendationProduct = {
  rank?: number;

  productCode: string;
  productName: string;

  minLoanAmount?: number;
  productMaxLoanAmount?: number;
  maxLoanAmount?: number;

  maxLtvPercent?: number;
  maxLoanByLtv?: number;
  effectiveMaxLoanAmount?: number;

  suggestedLoanAmount?: number;
  loanAmountCap?: number;

  monthlyInterestRatePercent?: number;
  principalPerMonth?: number;
  interestPerMonth?: number;
  estimatedMonthlyPayment?: number;

  tenor?: number;
  term?: number;
  loanTerm?: number;
  loanTermMonths?: number;
  durationMonths?: number;
  selectedTenor?: number;
  supportedTermMonths?: number[];
  recommended?: boolean;

  [key: string]: unknown;
};

export type LoanProductRecommendationData = {
  applicationCode?: string;
  loanPurpose?: string;
  assetType?: string;
  requestedTermMonths?: number;
  requestedAmount?: number;
  scoreGrade?: string;
  valuation?: {
    marketValue?: number;
    totalDeductionAmount?: number;
    finalValue?: number;
    appliedDeductionTypes?: string[];
  };
  recommendedProductCode?: string;
  products?: LoanProductRecommendationProduct[];
};

export type LoanProductRecommendationResponse = {
  success?: boolean;
  message?: string;
  data?: LoanProductRecommendationData;
  errorCode?: string | null;
  timestamp?: string;
};

export type SelectFinalLoanOfferPayload = {
  productCode: string;
  requestedAmount?: number;
  loanTermMonths?: number;
  paymentMethod?: string;
  monthlyPaymentDay?: number;
  processingBranch?: string;
};

export type FinalLoanOfferPreviewPayload = {
  requestedAmount?: number;
  loanTermMonths?: number;
  paymentMethod?: string;
  monthlyPaymentDay?: number;
  processingBranch?: string;
  limit?: number;
};

export type LoanScoringResponseData = {
  scoreGrade?: string;
  overallScore?: number;
  aScore?: number;
  bScore?: number;
  aScoreWeight?: number;
  bScoreWeight?: number;
  ltvPercent?: number;
  matchedRuleCode?: string;
  matchedRuleName?: string;
};

export type FinalLoanOfferResponse = {
  success?: boolean;
  message?: string;
  data?: {
    applicationCode?: string;
    selectedProductCode?: string;
    requestedAmount?: number;
    loanTermMonths?: number;
    paymentMethod?: string;
    monthlyPaymentDay?: number;
    processingBranch?: string;
    recommendedProductCode?: string;
    selectedLoanAmount?: number;
    estimatedMonthlyPayment?: number;
    scoring?: LoanScoringResponseData;
    products?: LoanProductRecommendationProduct[];
    [key: string]: unknown;
  };
  errorCode?: string | null;
  timestamp?: string;
};

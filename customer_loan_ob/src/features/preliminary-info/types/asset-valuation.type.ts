export type AssetTypeApiValue = "MOTORBIKE" | "CAR";

export type AssetValuationMarketPriceParams = {
  vehicleVariant: string;
};

export type AssetValuationMarketPriceData = {
  vehicleVariant: string;
  vehicleVariantName: string;
  marketValue: number;
  currencyCode: string;
  priceSource: string;
  effectiveFrom: string;
  effectiveTo: string;
};

export type AssetValuationMarketPriceResponse = {
  success?: boolean;
  message?: string;
  data?: AssetValuationMarketPriceData;
  errorCode?: string | null;
  timestamp?: string;
};

export type AssetValuationDeductionItem = {
  type: string;
  rate: number;
};

export type AssetValuationPayload = {
  assetSnapshot: {
    assetType: AssetTypeApiValue;
    brand: string;
    model: string;
    vehicleVariant: string;
    manufactureYear: number;
    vehicleColor: string;
    marketValue: number;
  };
  deductionItems: AssetValuationDeductionItem[];
};

export type AppliedDeduction = {
  type?: string;
  rate?: number;
  amount?: number;
  name?: string;
  description?: string;
};

export type AssetValuationPreviewData = {
  marketValue?: number;
  totalDeductionRate?: number;
  totalDeductionAmount?: number;
  finalValue?: number;
  ltvRatio?: number;
  loanableValue?: number;
  valuationState?: string;
  appliedDeductions?: AppliedDeduction[];

  currencyCode?: string;

  estimatedValue?: number;
  valueAfterDeduction?: number;
  maxLoanAmount?: number;
  ltvRate?: number;
  loanToValue?: number;
};

export type AssetValuationResponse = {
  success?: boolean;
  message?: string;
  data?: AssetValuationPreviewData;
  errorCode?: string | null;
  timestamp?: string;
} & AssetValuationPreviewData;
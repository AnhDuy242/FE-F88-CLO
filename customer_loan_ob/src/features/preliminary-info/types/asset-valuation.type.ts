export type AssetTypeApiValue = "MOTORBIKE" | "CAR";

export type AssetValuationMarketPriceParams = {
  assetType: AssetTypeApiValue;
  brand: string;
  model: string;
  vehicleVariant: string;
  manufactureYear: number;
  vehicleColor: string;
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
  success: boolean;
  message: string;
  data: AssetValuationMarketPriceData;
  errorCode: string | null;
  timestamp: string;
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
  };
  deductionItems: AssetValuationDeductionItem[];
};

export type AssetValuationPreviewData = {
  marketValue?: number;
  currencyCode?: string;
  totalDeductionRate?: number;
  totalDeductionAmount?: number;
  valueAfterDeduction?: number;
  maxLoanAmount?: number;
  ltvRate?: number;

  estimatedValue?: number;
  finalValue?: number;
  loanToValue?: number;
};

export type AssetValuationResponse = AssetValuationPreviewData & {
  success?: boolean;
  message?: string;
  data?: AssetValuationPreviewData;
  errorCode?: string | null;
  timestamp?: string;
};
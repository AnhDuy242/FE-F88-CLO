export type AssetValuationDeductionItem = {
  type: string;
  rate: number;
};

export type AssetValuationPayload = {
  assetSnapshot: {
    assetType: string;
    licensePlate: string;
    brand: string;
    model: string;
    vehicleVariant: string;
    manufactureYear: number;
    vehicleColor: string;
  };
  deductionItems: AssetValuationDeductionItem[];
};

export type AssetValuationResult = {
  marketValue?: number;
  totalDeductionRate?: number;
  totalDeductionAmount?: number;
  valueAfterDeduction?: number;
  maxLoanAmount?: number;
  ltvRate?: number;

  estimatedValue?: number;
  finalValue?: number;
  loanToValue?: number;
};

export type AssetValuationResponse = AssetValuationResult & {
  success?: boolean;
  message?: string;
  data?: AssetValuationResult;
};
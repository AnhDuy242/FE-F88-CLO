export type DeductionItem = {
  id: string;
  label: string;
  percent: number;
};

export type LoanPackageId = "standard" | "promotion" | "vip";

export type LoanPackage = {
  id: LoanPackageId;
  name: string;
  tag?: string;
  interestRate: number;
  ltv: number;
  maxLoanAmount: number;
  terms: number[];
  disabled?: boolean;
};

export type PreliminaryInfoPayload = {
  fullName: string;
  identityNumber?: string;
  phoneNumber?: string;
  dateOfBirth?: string;

  gender: string;
  job?: string;
  monthlyIncome?: string;
  loanPurpose?: string;
  desiredLoanAmount: string;
  term: string;

  assetType: string;
  plateNumber: string;
  brand?: string;
  model?: string;
  version?: string;
  manufactureYear?: string;
  color?: string;

  selectedDeductionIds: string[];
  totalDeductionPercent: number;
  marketValue: number;
  valueAfterDeduction: number;

  selectedPackageId: LoanPackageId;
  selectedTerm: string;
  monthlyPayment: number;
  maxLoanByAppraisal: number;
};

export type PreliminaryInfoResponse = {
  loanApplicationId?: string;
  message: string;
};
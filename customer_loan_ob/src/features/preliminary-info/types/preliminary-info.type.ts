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
  brand: string;
  model: string;
  version: string;
  manufactureYear: string;
  color: string;

  selectedDeductionIds: string[];
  totalDeductionPercent: number;
  marketValue: number;
  valueAfterDeduction: number;

  selectedPackageId?: LoanPackageId;
  selectedTerm: string;

  selectedProductCode?: string;
  recommendedProductCode?: string;

  monthlyPayment: number;
  maxLoanByAppraisal: number;
};

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errorCode?: string | null;
  timestamp?: string;
};

export type CreateLoanApplicationPayload = {
  customerCode: string;
  applicationChannel: string;
  branchCode: string;
  staffCode: string;
};

export type LoanApplicationDraftData = {
  applicationCode: string;
  applicationState: string;
  customerCode: string;
  createdDate?: string | null;
  lastSavedAt?: string | null;
};

export type PreliminaryApplicantSnapshotPayload = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  identifierNumber: string;
  phoneNumber: string;
  occupation: string;
  monthlyIncome: number;
};

export type PreliminaryLoanRequestPayload = {
  loanPurpose: string;
  requestedAmount: number;
  requestedTenure: number;
};

export type SaveLoanApplicationDraftPayload = {
  applicantSnapshot: PreliminaryApplicantSnapshotPayload;
  loanRequest: PreliminaryLoanRequestPayload;
};

export type StepCompletionData = {
  applicationCode: string;
  step: string;
  completed: boolean;
  nextStep?: string | null;
  validationErrors: string[];
};

export type PreliminaryInfoResponse = {
  success?: boolean;
  message?: string;
  data?: {
    loanApplicationId?: string;
    applicationCode?: string;
  };
  errorCode?: string | null;
  timestamp?: string;
  loanApplicationId?: string;
  applicationCode?: string;
};

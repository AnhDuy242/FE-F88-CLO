import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

export const LOAN_APPLICATION_DRAFT_STEPS = {
  customerIdentify: "CUSTOMER_IDENTIFY",
  preliminaryInfo: "PRELIMINARY_INFO",
  customerAssetLoanProposal: "CUSTOMER_ASSET_LOAN_PROPOSAL",
  uploadComplete: "UPLOAD_COMPLETE",
} as const;

export type LoanApplicationDraftStepCode =
  (typeof LOAN_APPLICATION_DRAFT_STEPS)[keyof typeof LOAN_APPLICATION_DRAFT_STEPS];

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errorCode?: string | null;
  timestamp?: string;
};

export type CreateLoanApplicationDraftPayload = {
  customerId?: string;
  customerCode?: string;
  customerIdentifyPayload?: Record<string, unknown>;
};

export type LoanApplicationDraftCustomer = {
  customerId?: string;
  customerCode?: string;
  fullName?: string;
  identityNumber?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  status?: string;
};

export type LoanApplicationDraftStatus =
  | "DRAFT"
  | "COMPLETED"
  | "CONVERTED"
  | "CANCELLED"
  | "EXPIRED";

export type LoanApplicationDraftStepStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type LoanApplicationDraftStep = {
  stepCode: string;
  stepName?: string;
  stepOrder?: number;
  status?: LoanApplicationDraftStepStatus | string;
  requiresReview?: boolean;
  invalidatedByStepCode?: string | null;
  invalidatedReason?: string | null;
  completedAt?: string | null;
  reviewedAt?: string | null;
  updatedAt?: string | null;
  payload?: Record<string, unknown>;
};

export type LoanApplicationDraftOverview = {
  draftId: string;
  draftCode?: string;
  customerId?: string;
  customer?: LoanApplicationDraftCustomer;
  status?: LoanApplicationDraftStatus | string;
  currentStepCode?: string;
  currentStepName?: string;
  currentStepPayload?: Record<string, unknown>;
  expiredAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  convertedLoanApplicationCode?: string | null;
  steps?: LoanApplicationDraftStep[];
};

export type LoanApplicationDraftSummary = {
  draftCode: string;
  status?: LoanApplicationDraftStatus | string;
  customerCode?: string;
  customerName?: string;
  phoneNumber?: string;
  currentStepCode?: string;
  currentStepName?: string;
  expiredAt?: string | null;
  updatedAt?: string | null;
  convertedLoanApplicationCode?: string | null;
};

export type LoanApplicationDraftStepPayload = {
  draftId: string;
  stepCode: string;
  status?: string;
  payload?: Record<string, unknown>;
};

export type SaveLoanApplicationDraftStepPayload = {
  status?: "NOT_STARTED" | "IN_PROGRESS";
  payload: Record<string, unknown>;
};

export type SaveLoanApplicationDraftStepData = {
  draftCode: string;
  stepCode: string;
  stepStatus?: string;
  currentStepCode?: string;
  draftCompleted?: boolean;
  message?: string;
};

export type CompleteLoanApplicationDraftStepPayload = {
  payload: Record<string, unknown>;
};

export type LoanApplicationDraftOverviewResponse =
  ApiResponse<LoanApplicationDraftOverview>;

export type LoanApplicationDraftListResponse =
  ApiResponse<LoanApplicationDraftSummary[]>;

export type LoanApplicationDraftStepPayloadResponse =
  ApiResponse<LoanApplicationDraftStepPayload>;

export type SaveLoanApplicationDraftStepResponse =
  ApiResponse<SaveLoanApplicationDraftStepData>;

export type SubmitLoanApplicationDraftDocument = {
  documentTypeCode: string;
  fileUrl: string;
  fileName: string;
};

export type SubmitLoanApplicationDraftPayload = {
  documents: SubmitLoanApplicationDraftDocument[];
};

export type SubmitLoanApplicationDraftData = {
  draftCode?: string;
  status?: string;
  applicationCode?: string | null;
  message?: string;
};

export type SubmitLoanApplicationDraftResponse =
  ApiResponse<SubmitLoanApplicationDraftData>;

export type DraftDocumentRequirementItem = {
  documentCode: string;
  documentName: string;
  required?: boolean;
  allowedExtensions?: string[];
  maxSizeMb?: number;
};

export type DraftDocumentRequirementGroup = {
  groupCode: string;
  groupName: string;
  requiredCount?: number;
  totalCount?: number;
  documents?: DraftDocumentRequirementItem[];
};

export type DraftDocumentUploadResult = {
  documentCode: string;
  documentName?: string;
  groupCode?: string;
  fileUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
  status?: string;
  error?: string;
};

export type DraftDocumentRequirementsResponse =
  ApiResponse<DraftDocumentRequirementGroup[]>;

export type DraftDocumentUploadResponse =
  ApiResponse<DraftDocumentUploadResult>;

export const loanApplicationDraftApi = {
  create: async (
    payload: CreateLoanApplicationDraftPayload,
  ): Promise<LoanApplicationDraftOverviewResponse> => {
    return axiosClient.post<
      LoanApplicationDraftOverviewResponse,
      LoanApplicationDraftOverviewResponse,
      CreateLoanApplicationDraftPayload
    >(API_ENDPOINTS.loanApplicationDraft.create, payload);
  },

  getOverview: async (
    draftCode: string,
  ): Promise<LoanApplicationDraftOverviewResponse> => {
    return axiosClient.get<
      LoanApplicationDraftOverviewResponse,
      LoanApplicationDraftOverviewResponse
    >(API_ENDPOINTS.loanApplicationDraft.overview(draftCode));
  },

  list: async (
    status?: LoanApplicationDraftStatus,
  ): Promise<LoanApplicationDraftListResponse> => {
    return axiosClient.get<
      LoanApplicationDraftListResponse,
      LoanApplicationDraftListResponse
    >(API_ENDPOINTS.loanApplicationDraft.create, {
      params: status ? { status } : undefined,
    });
  },

  getStepPayload: async (
    draftCode: string,
    stepCode: LoanApplicationDraftStepCode,
  ): Promise<LoanApplicationDraftStepPayloadResponse> => {
    return axiosClient.get<
      LoanApplicationDraftStepPayloadResponse,
      LoanApplicationDraftStepPayloadResponse
    >(API_ENDPOINTS.loanApplicationDraft.step(draftCode, stepCode));
  },

  saveStep: async (
    draftCode: string,
    stepCode: LoanApplicationDraftStepCode,
    payload: SaveLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return axiosClient.put<
      SaveLoanApplicationDraftStepResponse,
      SaveLoanApplicationDraftStepResponse,
      SaveLoanApplicationDraftStepPayload
    >(API_ENDPOINTS.loanApplicationDraft.step(draftCode, stepCode), payload);
  },

  completeStep: async (
    draftCode: string,
    stepCode: LoanApplicationDraftStepCode,
    payload: CompleteLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return axiosClient.post<
      SaveLoanApplicationDraftStepResponse,
      SaveLoanApplicationDraftStepResponse,
      CompleteLoanApplicationDraftStepPayload
    >(API_ENDPOINTS.loanApplicationDraft.completeStep(draftCode, stepCode), payload);
  },

  savePreliminaryInfo: async (
    draftCode: string,
    payload: SaveLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return loanApplicationDraftApi.saveStep(
      draftCode,
      LOAN_APPLICATION_DRAFT_STEPS.preliminaryInfo,
      payload,
    );
  },

  completePreliminaryInfo: async (
    draftCode: string,
    payload: CompleteLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return loanApplicationDraftApi.completeStep(
      draftCode,
      LOAN_APPLICATION_DRAFT_STEPS.preliminaryInfo,
      payload,
    );
  },

  saveCustomerAssetLoanProposal: async (
    draftCode: string,
    payload: SaveLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return loanApplicationDraftApi.saveStep(
      draftCode,
      LOAN_APPLICATION_DRAFT_STEPS.customerAssetLoanProposal,
      payload,
    );
  },

  completeCustomerAssetLoanProposal: async (
    draftCode: string,
    payload: CompleteLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    return loanApplicationDraftApi.completeStep(
      draftCode,
      LOAN_APPLICATION_DRAFT_STEPS.customerAssetLoanProposal,
      payload,
    );
  },

  getDocumentRequirements: async (
    draftCode: string,
  ): Promise<DraftDocumentRequirementsResponse> => {
    return axiosClient.get<
      DraftDocumentRequirementsResponse,
      DraftDocumentRequirementsResponse
    >(API_ENDPOINTS.loanApplicationDraft.documentRequirements(draftCode));
  },

  uploadDocument: async (
    draftCode: string,
    documentCode: string,
    file: File,
  ): Promise<DraftDocumentUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosClient.post<
      DraftDocumentUploadResponse,
      DraftDocumentUploadResponse,
      FormData
    >(API_ENDPOINTS.loanApplicationDraft.uploadDocument(draftCode, documentCode), formData);
  },

  submit: async (
    draftCode: string,
    payload: SubmitLoanApplicationDraftPayload,
  ): Promise<SubmitLoanApplicationDraftResponse> => {
    return axiosClient.post<
      SubmitLoanApplicationDraftResponse,
      SubmitLoanApplicationDraftResponse,
      SubmitLoanApplicationDraftPayload
    >(API_ENDPOINTS.loanApplicationDraft.submit(draftCode), payload);
  },
};

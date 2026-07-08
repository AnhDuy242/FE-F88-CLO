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
  | "CREATED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SUBMITTED"
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
  draftId?: string;
  applicationId?: string;
  applicationCode?: string;
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
  applicationCode?: string;
  applicationState?: string;
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
  draftCode?: string;
  applicationCode?: string;
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

export type UploadLoanApplicationDraftDocument = {
  documentTypeCode: string;
  file: File;
};

export type SubmitLoanApplicationDraftPayload = {
  documents: UploadLoanApplicationDraftDocument[];
};

export type UploadedLoanApplicationDocument = {
  documentId?: string;
  documentTypeCode: string;
  documentTypeName?: string;
  fileUrl: string;
  fileName: string;
  uploadedAt?: string;
};

export type UploadLoanApplicationDraftDocumentsData = {
  applicationCode?: string;
  uploadedCount?: number;
  documents: UploadedLoanApplicationDocument[];
};

export type UploadLoanApplicationDraftDocumentsResponse =
  ApiResponse<UploadLoanApplicationDraftDocumentsData>;

export type SubmitLoanApplicationDraftData = {
  draftCode?: string;
  status?: string;
  applicationCode?: string | null;
  message?: string;
};

export type SubmitLoanApplicationDraftResponse =
  ApiResponse<SubmitLoanApplicationDraftData>;

export const loanApplicationDraftApi = {
  create: async (
    payload: CreateLoanApplicationDraftPayload,
  ): Promise<LoanApplicationDraftOverviewResponse> => {
    const response = await axiosClient.post<
      LoanApplicationDraftOverviewResponse,
      LoanApplicationDraftOverviewResponse,
      CreateLoanApplicationDraftPayload
    >(API_ENDPOINTS.loanApplicationDraft.create, payload);

    return normalizeOverviewResponse(response);
  },

  getOverview: async (
    draftCode: string,
  ): Promise<LoanApplicationDraftOverviewResponse> => {
    const response = await axiosClient.get<
      LoanApplicationDraftOverviewResponse,
      LoanApplicationDraftOverviewResponse
    >(API_ENDPOINTS.loanApplicationDraft.overview(draftCode));

    return normalizeOverviewResponse(response);
  },

  list: async (
    status?: LoanApplicationDraftStatus,
  ): Promise<LoanApplicationDraftListResponse> => {
    const onboardingStatus = status === "DRAFT" ? undefined : status;

    const response = await axiosClient.get<
      LoanApplicationDraftListResponse,
      LoanApplicationDraftListResponse
    >(API_ENDPOINTS.loanApplicationDraft.create, {
      params: onboardingStatus ? { status: onboardingStatus } : undefined,
    });

    return normalizeListResponse(response);
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
    const response = await axiosClient.post<
      SaveLoanApplicationDraftStepResponse,
      SaveLoanApplicationDraftStepResponse,
      CompleteLoanApplicationDraftStepPayload
    >(API_ENDPOINTS.loanApplicationDraft.completeStep(draftCode, stepCode), {
      payload: payload.payload,
    });

    return normalizeStepActionResponse(response);
  },

  completeStep: async (
    draftCode: string,
    stepCode: LoanApplicationDraftStepCode,
    payload: CompleteLoanApplicationDraftStepPayload,
  ): Promise<SaveLoanApplicationDraftStepResponse> => {
    const response = await axiosClient.post<
      SaveLoanApplicationDraftStepResponse,
      SaveLoanApplicationDraftStepResponse,
      CompleteLoanApplicationDraftStepPayload
    >(API_ENDPOINTS.loanApplicationDraft.completeStep(draftCode, stepCode), payload);

    return normalizeStepActionResponse(response);
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

  submit: async (
    draftCode: string,
    payload: SubmitLoanApplicationDraftPayload,
  ): Promise<SubmitLoanApplicationDraftResponse> => {
    const uploadResponse = await loanApplicationDraftApi.uploadDocuments(
      draftCode,
      payload.documents,
    );
    const uploadedDocuments = uploadResponse.data?.documents || [];

    await loanApplicationDraftApi.completeStep(
      draftCode,
      LOAN_APPLICATION_DRAFT_STEPS.uploadComplete,
      { payload: { documents: uploadedDocuments } },
    );

    const response = await axiosClient.post<
      SubmitLoanApplicationDraftResponse,
      SubmitLoanApplicationDraftResponse,
      { documents: UploadedLoanApplicationDocument[] }
    >(API_ENDPOINTS.loanApplicationDraft.submit(draftCode), {
      documents: uploadedDocuments,
    });

    return normalizeSubmitResponse(response);
  },

  uploadDocuments: async (
    draftCode: string,
    documents: UploadLoanApplicationDraftDocument[],
  ): Promise<UploadLoanApplicationDraftDocumentsResponse> => {
    const formData = new FormData();

    documents.forEach((document) => {
      formData.append("documentTypeCodes", document.documentTypeCode);
      formData.append("files", document.file);
    });

    return axiosClient.post<
      UploadLoanApplicationDraftDocumentsResponse,
      UploadLoanApplicationDraftDocumentsResponse,
      FormData
    >(API_ENDPOINTS.loanApplicationDraft.documents(draftCode), formData);
  },
};

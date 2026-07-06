import type {
  LoanApplicationDraftOverview,
} from "@/features/loan-onboarding/api/loan-application-draft.api";
import type {
  AssetDataState,
  CustomerAssetDetailState,
  ReferencePersonState,
  Step1CustomerIdentifyState,
  Step2PreliminaryInfoState,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import type { CustomerIdentifyResponse } from "@/features/customer-identify/types/customer-identify.type";

export const DRAFT_STEP_ROUTES = {
  CUSTOMER_IDENTIFY: "/loan/customer-identify",
  PRELIMINARY_INFO: "/loan/preliminary-info",
  CUSTOMER_ASSET_LOAN_PROPOSAL: "/loan/customer-asset-detail",
  UPLOAD_COMPLETE: "/loan/upload-documents",
} as const;

export type ResumeRoute = (typeof DRAFT_STEP_ROUTES)[keyof typeof DRAFT_STEP_ROUTES];

export type ResumeDraftState = {
  currentStep: number;
  route: ResumeRoute;
  draftInfo: {
    draftId?: string;
    draftCode?: string;
    currentStepCode?: string;
  };
  selectedCustomer: Record<string, unknown> | null;
  customerIdentifyData: CustomerIdentifyResponse | null;
  ocrData: Record<string, unknown> | null;
  phoneNumber: string;
  step1CustomerIdentify: Partial<Step1CustomerIdentifyState>;
  step2PreliminaryInfo: Partial<Step2PreliminaryInfoState>;
  customerAssetDetailData: CustomerAssetDetailState | null;
  assetData: AssetDataState | null;
  references: ReferencePersonState[];
  selectedLoanProduct: Record<string, unknown> | null;
  loanRecommendation: Record<string, unknown> | null;
  applicationCode: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeDraftPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeDraftPayload);
  }

  if (!isRecord(value)) {
    if (typeof value === "string" && value.startsWith("data:")) {
      return "";
    }

    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(base64|file|blob)/i.test(key))
      .map(([key, childValue]) => [key, sanitizeDraftPayload(childValue)]),
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getStepPayload(
  detail: LoanApplicationDraftOverview,
  stepCode: string,
): Record<string, unknown> {
  const step = detail.steps?.find((item) => item.stepCode === stepCode);
  return toRecord(sanitizeDraftPayload(step?.payload));
}

function getString(source: unknown, keys: string[]) {
  const record = toRecord(source);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function getNumberString(source: unknown, keys: string[]) {
  const value = getString(source, keys);
  return value ? String(value).replace(/\D/g, "") : "";
}

function getStringArray(source: unknown, keys: string[]) {
  const record = toRecord(source);

  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
  }

  return [];
}

function getRecord(source: unknown, keys: string[]) {
  const record = toRecord(source);

  for (const key of keys) {
    const value = record[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return {};
}

function firstNonEmptyRecord(...records: Record<string, unknown>[]) {
  return records.find((record) => Object.keys(record).length > 0) || {};
}

function getRecordArray(source: unknown, keys: string[]) {
  const record = toRecord(source);

  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function stepToNumber(stepCode?: string) {
  if (stepCode === "PRELIMINARY_INFO") return 2;
  if (stepCode === "CUSTOMER_ASSET_LOAN_PROPOSAL") return 3;
  if (stepCode === "UPLOAD_COMPLETE") return 4;
  return 1;
}

export function getDraftRoute(stepCode?: string): ResumeRoute {
  if (stepCode && stepCode in DRAFT_STEP_ROUTES) {
    return DRAFT_STEP_ROUTES[stepCode as keyof typeof DRAFT_STEP_ROUTES];
  }

  return DRAFT_STEP_ROUTES.CUSTOMER_IDENTIFY;
}

function mapReferences(records: Record<string, unknown>[]): ReferencePersonState[] {
  return records.map((item) => ({
    fullName: getString(item, ["fullName", "name"]),
    relationshipType: getString(item, ["relationshipType", "relationship"]),
    phoneNumber: getString(item, ["phoneNumber", "phone"]),
    address: getString(item, ["address"]),
    note: getString(item, ["note"]),
  }));
}

function mapAssetData(source: Record<string, unknown>): AssetDataState {
  return {
    assetType: getString(source, ["assetType"]),
    licensePlate: getString(source, ["licensePlate", "plateNumber"]),
    brand: getString(source, ["brand"]),
    model: getString(source, ["model"]),
    version: getString(source, ["version"]),
    vehicleVariant: getString(source, ["vehicleVariant"]),
    manufactureYear: getString(source, ["manufactureYear"]),
    vehicleColor: getString(source, ["vehicleColor", "color"]),
    selectedDeductionIds: getStringArray(source, ["selectedDeductionIds"]),
    selectedDeductionItems: getRecordArray(source, ["selectedDeductionItems", "deductionItems"]).map(
      (item) => ({
        type: getString(item, ["type", "id"]),
        rate: Number(getString(item, ["rate", "percent"]) || 0),
        label: getString(item, ["label"]),
      }),
    ),
    frameNumber: getString(source, ["frameNumber"]),
    engineNumber: getString(source, ["engineNumber"]),
    vehicleOwnerName: getString(source, ["vehicleOwnerName", "ownerName"]),
    registrationNumber: getString(source, ["registrationNumber"]),
    registrationIssueDate: getString(source, [
      "registrationIssueDate",
      "registrationDate",
    ]),
  };
}

export function mapDraftDetailToOnboardingState(
  detail: LoanApplicationDraftOverview,
): ResumeDraftState {
  const customerIdentifyPayload = getStepPayload(detail, "CUSTOMER_IDENTIFY");
  const preliminaryPayload = getStepPayload(detail, "PRELIMINARY_INFO");
  const customerAssetPayload = getStepPayload(
    detail,
    "CUSTOMER_ASSET_LOAN_PROPOSAL",
  );

  const customer = detail.customer || {};
  const applicantSnapshot = getRecord(preliminaryPayload, ["applicantSnapshot"]);
  const loanRequest = getRecord(preliminaryPayload, ["loanRequest"]);
  const preliminaryAsset = getRecord(preliminaryPayload, ["assetSnapshot"]);
  const valuation = getRecord(preliminaryPayload, ["valuation"]);
  const recommendation = firstNonEmptyRecord(
    getRecord(customerAssetPayload, ["loanProductRecommendation"]),
    getRecord(preliminaryPayload, ["loanProductRecommendation"]),
  );
  const selectedLoanProduct = firstNonEmptyRecord(
    getRecord(customerAssetPayload, ["selectedLoanProduct"]),
    getRecord(preliminaryPayload, ["selectedLoanProduct"]),
  );
  const customerDetail = getRecord(customerAssetPayload, ["customerDetail"]);
  const assetDetail = getRecord(customerAssetPayload, ["assetDetail"]);
  const references = mapReferences(
    getRecordArray(customerAssetPayload, ["referencePersons", "references"]),
  );
  const assetData = mapAssetData(
    Object.keys(assetDetail).length > 0 ? assetDetail : preliminaryAsset,
  );

  const fullName =
    getString(customerDetail, ["fullName"]) ||
    getString(applicantSnapshot, ["fullName"]) ||
    getString(customerIdentifyPayload, ["fullName"]) ||
    customer.fullName ||
    "";
  const dateOfBirth =
    getString(customerDetail, ["dateOfBirth"]) ||
    getString(applicantSnapshot, ["dateOfBirth"]) ||
    getString(customerIdentifyPayload, ["dateOfBirth"]) ||
    customer.dateOfBirth ||
    "";
  const identityNumber =
    getString(customerDetail, ["identityNumber", "identifierNumber"]) ||
    getString(applicantSnapshot, ["identityNumber", "identifierNumber"]) ||
    getString(customerIdentifyPayload, [
      "identityNumber",
      "identifierNumber",
      "cccdNumber",
    ]) ||
    customer.identityNumber ||
    "";
  const phoneNumber =
    getString(customerDetail, ["phoneNumber"]) ||
    getString(applicantSnapshot, ["phoneNumber"]) ||
    getString(customerIdentifyPayload, ["phoneNumber"]) ||
    customer.phoneNumber ||
    "";
  const gender =
    getString(customerDetail, ["gender"]) ||
    getString(applicantSnapshot, ["gender"]) ||
    getString(customerIdentifyPayload, ["gender", "sex"]);
  const currentStepCode = detail.currentStepCode || "CUSTOMER_IDENTIFY";
  const selectedProductCode =
    getString(customerAssetPayload, ["selectedLoanProductCode"]) ||
    getString(preliminaryPayload, ["selectedProductCode"]) ||
    getString(selectedLoanProduct, ["productCode"]) ||
    getString(recommendation, ["recommendedProductCode"]);

  const selectedCustomer = {
    customerId: customer.customerId || "",
    customerCode: customer.customerCode || "",
    fullName,
    identityNumber,
    identifierNumber: identityNumber,
    phoneNumber,
    dateOfBirth,
  };
  const customerIdentifyData: CustomerIdentifyResponse = {
    success: true,
    message: "Resumed from draft",
    data: {
      found: Boolean(customer.customerCode),
      customerCode: customer.customerCode || "",
      lookupStatus: "RESUMED_DRAFT",
      onboardingPermission: "ALLOW_CREATE_APPLICATION",
      matchedCustomer: selectedCustomer,
    },
  };

  const step2PreliminaryInfo: Partial<Step2PreliminaryInfoState> = {
    fullName,
    identityNumber,
    phoneNumber,
    dateOfBirth,
    gender,
    job: getString(applicantSnapshot, ["occupation", "job"]),
    monthlyIncome: getNumberString(applicantSnapshot, ["monthlyIncome"]),
    loanPurpose: getString(loanRequest, ["loanPurpose", "loanPurposeCode"]),
    desiredLoanAmount: getNumberString(loanRequest, ["requestedAmount"]),
    term: getString(loanRequest, ["requestedTenure", "termMonths"]),
    assetType: assetData.assetType,
    brand: assetData.brand,
    model: assetData.model,
    version: assetData.version,
    manufactureYear: assetData.manufactureYear,
    color: assetData.vehicleColor,
    selectedDeductionIds: getStringArray(valuation, ["selectedDeductionIds"]),
    selectedProductCode,
    recommendedProductCode:
      getString(recommendation, ["recommendedProductCode"]) || selectedProductCode,
    draftId: detail.draftId,
    draftCode: detail.draftCode,
    currentStepCode,
    applicationCode: detail.convertedLoanApplicationCode || "",
    loanApplicationCode: detail.convertedLoanApplicationCode || "",
  };

  const customerAssetDetailData: CustomerAssetDetailState | null =
    Object.keys(customerAssetPayload).length > 0
      ? {
          fullName,
          identityNumber,
          phoneNumber,
          dateOfBirth,
          gender,
          email: getString(customerDetail, ["email"]),
          maritalStatus: getString(customerDetail, ["maritalStatus"]),
          dependentCount: getString(customerDetail, ["dependentCount"]),
          occupationCode: getString(customerDetail, ["occupationCode"]),
          workplaceName: getString(customerDetail, ["workplaceName"]),
          incomeSourceCode: getString(customerDetail, ["incomeSourceCode"]),
          monthlyIncomeAmount: getNumberString(customerDetail, [
            "monthlyIncomeAmount",
          ]),
          disbursementBankCode: getString(customerDetail, [
            "disbursementBankCode",
          ]),
          disbursementAccountNumber: getString(customerDetail, [
            "disbursementAccountNumber",
          ]),
          disbursementAccountName: getString(customerDetail, [
            "disbursementAccountName",
          ]),
          permanentAddress: getString(customerDetail, ["permanentAddress"]),
          currentAddress: getString(customerDetail, ["currentAddress"]),
          references,
          assetData,
          selectedLoanProductCode: selectedProductCode,
        }
      : null;

  return {
    currentStep: stepToNumber(currentStepCode),
    route: getDraftRoute(currentStepCode),
    draftInfo: {
      draftId: detail.draftId,
      draftCode: detail.draftCode,
      currentStepCode,
    },
    selectedCustomer,
    customerIdentifyData,
    ocrData: customerIdentifyPayload,
    phoneNumber,
    step1CustomerIdentify: {
      fullName,
      dateOfBirth,
      phoneNumber,
      identityNumber,
      cccdNumber: identityNumber,
      customerId: customer.customerId || "",
      customerCode: customer.customerCode || "",
      draftId: detail.draftId,
      draftCode: detail.draftCode,
      currentStepCode,
      customerCheckResult: customerIdentifyData,
      ocrData: customerIdentifyPayload,
      applicationCode: detail.convertedLoanApplicationCode || "",
      loanApplicationCode: detail.convertedLoanApplicationCode || "",
    },
    step2PreliminaryInfo,
    customerAssetDetailData,
    assetData,
    references,
    selectedLoanProduct:
      Object.keys(selectedLoanProduct).length > 0 ? selectedLoanProduct : null,
    loanRecommendation:
      Object.keys(recommendation).length > 0 ? recommendation : null,
    applicationCode: detail.convertedLoanApplicationCode || "",
  };
}

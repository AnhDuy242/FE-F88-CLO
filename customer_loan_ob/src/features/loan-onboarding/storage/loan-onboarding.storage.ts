import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CustomerIdentifyResponse } from "@/features/customer-identify/types/customer-identify.type";

export type LoanOnboardingImageMeta = {
  name: string;
  size: number;
  type: string;
};

export type UploadedDocumentMeta = LoanOnboardingImageMeta & {
  id: string;
  groupId: string;
  documentType: string;
  required: boolean;
  uploadedAt: string;
};

export type Step1IdentityStorage = {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  identityNumber?: string;
  cccdNumber?: string;
  address?: string;

  customerId?: string;
  customerCode?: string;
  customerStatus?: string;
  applicationCode?: string;
  loanApplicationCode?: string;
  loanApplicationId?: string;

  documentType?: string;
  sex?: string;
  gender?: string;
  nationality?: string;
  issueDate?: string;
  issuePlace?: string;
  expiryDate?: string;

  lookupStatus?: string;
  onboardingPermission?: string;

  [key: string]: unknown;
};

export type Step2PreliminaryInfoStorage = {
  fullName?: string;
  identityNumber?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;

  job?: string;
  monthlyIncome?: string;
  loanPurpose?: string;
  desiredLoanAmount?: string;
  term?: string;

  assetType?: string;
  brand?: string;
  model?: string;
  version?: string;
  manufactureYear?: string;
  color?: string;

  selectedDeductionIds?: string[];
  selectedPackageId?: string;
  selectedTerm?: string;
  selectedProductCode?: string;
  recommendedProductCode?: string;

  applicationCode?: string;
  loanApplicationCode?: string;
  loanApplicationId?: string;

  [key: string]: unknown;
};

export type Step1CustomerIdentifyState = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  identityNumber: string;
  cccdNumber: string;
  address: string;

  customerId: string;
  customerCode: string;
  customerStatus: string;
  applicationCode: string;
  loanApplicationCode: string;
  loanApplicationId: string;

  sex: string;
  gender: string;
  nationality: string;
  issueDate: string;
  issuePlace: string;
  expiryDate: string;
  documentType: string;

  lookupStatus: string;
  onboardingPermission: string;

  ocrData: Record<string, unknown> | null;
  customerCheckResult: CustomerIdentifyResponse | null;

  frontImageMeta: LoanOnboardingImageMeta | null;
  backImageMeta: LoanOnboardingImageMeta | null;

  ocrSuccessMessage: string;
  ocrErrorMessage: string;

  [key: string]: unknown;
};

export type Step2PreliminaryInfoState = {
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;

  job: string;
  monthlyIncome: string;
  loanPurpose: string;
  desiredLoanAmount: string;
  term: string;

  assetType: string;
  brand: string;
  model: string;
  version: string;
  manufactureYear: string;
  color: string;

  selectedDeductionIds: string[];
  selectedPackageId: string;
  selectedTerm: string;
  selectedProductCode: string;
  recommendedProductCode: string;

  [key: string]: unknown;
};

export type ReferencePersonState = {
  fullName: string;
  relationshipType: string;
  phoneNumber: string;
  address: string;
  note?: string;
};

export type AssetDataState = {
  assetType: string;
  licensePlate: string;
  brand: string;
  model: string;
  version: string;
  vehicleVariant: string;
  manufactureYear: string;
  vehicleColor: string;
  selectedDeductionIds: string[];
  selectedDeductionItems: {
    type: string;
    rate: number;
    label?: string;
  }[];
  frameNumber: string;
  engineNumber: string;
  vehicleOwnerName: string;
  registrationNumber: string;
  registrationIssueDate: string;
};

export type CustomerAssetDetailState = {
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  maritalStatus: string;
  dependentCount: string;
  occupationCode: string;
  workplaceName: string;
  incomeSourceCode: string;
  monthlyIncomeAmount: string;
  disbursementBankCode: string;
  disbursementAccountNumber: string;
  disbursementAccountName: string;
  permanentAddress: string;
  currentAddress: string;
  references: ReferencePersonState[];
  assetData: AssetDataState;
  selectedLoanProductCode: string;
};

type LoanOnboardingStoreState = {
  applicationCode: string;
  currentStep: number;
  ocrData: Record<string, unknown> | null;
  customerIdentifyData: CustomerIdentifyResponse | null;
  selectedCustomer: Record<string, unknown> | null;
  phoneNumber: string;
  preliminaryInfoData: Step2PreliminaryInfoState | null;
  customerAssetDetailData: CustomerAssetDetailState | null;
  step3Data: CustomerAssetDetailState | null;
  assetData: AssetDataState | null;
  references: ReferencePersonState[];
  uploadedDocuments: UploadedDocumentMeta[];
  selectedLoanProduct: Record<string, unknown> | null;
  loanRecommendation: Record<string, unknown> | null;

  step1CustomerIdentify: Step1CustomerIdentifyState;
  step2PreliminaryInfo: Step2PreliminaryInfoState;

  setApplicationCode: (applicationCode: string) => void;
  setCurrentStep: (currentStep: number) => void;

  setStep1CustomerIdentify: (
    data: Partial<Step1CustomerIdentifyState>,
  ) => void;

  setStep2PreliminaryInfo: (
    data: Partial<Step2PreliminaryInfoState>,
  ) => void;

  setCustomerIdentifyData: (
    customerIdentifyData: CustomerIdentifyResponse | null,
  ) => void;
  setOcrData: (ocrData: Record<string, unknown> | null) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setSelectedCustomer: (selectedCustomer: Record<string, unknown> | null) => void;
  setSelectedLoanProduct: (
    selectedLoanProduct: Record<string, unknown> | null,
  ) => void;
  setCustomerAssetDetailData: (
    customerAssetDetailData: CustomerAssetDetailState | null,
  ) => void;
  setStep3Data: (step3Data: CustomerAssetDetailState | null) => void;
  setAssetData: (assetData: AssetDataState | null) => void;
  setReferences: (references: ReferencePersonState[]) => void;
  setUploadedDocuments: (uploadedDocuments: UploadedDocumentMeta[]) => void;
  setLoanRecommendation: (
    loanRecommendation: Record<string, unknown> | null,
  ) => void;

  prefillStep2FromStep1: () => void;

  clearStep1CustomerIdentify: () => void;
  clearStep2PreliminaryInfo: () => void;
  resetLoanOnboarding: () => void;
  resetOnboarding: () => void;
};

const initialStep1CustomerIdentify: Step1CustomerIdentifyState = {
  fullName: "",
  dateOfBirth: "",
  phoneNumber: "",
  identityNumber: "",
  cccdNumber: "",
  address: "",

  customerId: "",
  customerCode: "",
  customerStatus: "",
  applicationCode: "",
  loanApplicationCode: "",
  loanApplicationId: "",

  sex: "",
  gender: "",
  nationality: "",
  issueDate: "",
  issuePlace: "",
  expiryDate: "",
  documentType: "",

  lookupStatus: "",
  onboardingPermission: "",

  ocrData: null,
  customerCheckResult: null,

  frontImageMeta: null,
  backImageMeta: null,

  ocrSuccessMessage: "",
  ocrErrorMessage: "",
};

const initialStep2PreliminaryInfo: Step2PreliminaryInfoState = {
  fullName: "",
  identityNumber: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",

  job: "",
  monthlyIncome: "",
  loanPurpose: "",
  desiredLoanAmount: "",
  term: "12",

  assetType: "",
  brand: "",
  model: "",
  version: "",
  manufactureYear: "",
  color: "",

  selectedDeductionIds: [],
  selectedPackageId: "promotion",
  selectedTerm: "12",
  selectedProductCode: "",
  recommendedProductCode: "",
};

export const initialReferencePersons: ReferencePersonState[] = Array.from(
  { length: 3 },
  () => ({
    fullName: "",
    relationshipType: "",
    phoneNumber: "",
    address: "",
    note: "",
  }),
);

export const initialAssetData: AssetDataState = {
  assetType: "",
  licensePlate: "",
  brand: "",
  model: "",
  version: "",
  vehicleVariant: "",
  manufactureYear: "",
  vehicleColor: "",
  selectedDeductionIds: [],
  selectedDeductionItems: [],
  frameNumber: "",
  engineNumber: "",
  vehicleOwnerName: "",
  registrationNumber: "",
  registrationIssueDate: "",
};

export const initialCustomerAssetDetailData: CustomerAssetDetailState = {
  fullName: "",
  identityNumber: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  maritalStatus: "",
  dependentCount: "",
  occupationCode: "",
  workplaceName: "",
  incomeSourceCode: "",
  monthlyIncomeAmount: "",
  disbursementBankCode: "",
  disbursementAccountNumber: "",
  disbursementAccountName: "",
  permanentAddress: "",
  currentAddress: "",
  references: initialReferencePersons,
  assetData: initialAssetData,
  selectedLoanProductCode: "",
};

function getStringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getObjectFromKnownResponse(rawData: unknown) {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const rawRecord = rawData as Record<string, unknown>;

  if (rawRecord.data && typeof rawRecord.data === "object") {
    return rawRecord.data as Record<string, unknown>;
  }

  return rawRecord;
}

function normalizeOcrData(rawData: unknown) {
  const data = getObjectFromKnownResponse(rawData);

  if (!data) {
    return {};
  }

  return {
    fullName: getStringValue(data, [
      "fullName",
      "name",
      "customerName",
      "hoTen",
      "hoVaTen",
    ]),
    dateOfBirth: getStringValue(data, [
      "dateOfBirth",
      "dob",
      "birthDate",
      "birthday",
      "ngaySinh",
      "dateOfBirthFormatted",
    ]),
    identityNumber: getStringValue(data, [
      "identityNumber",
      "idNumber",
      "citizenId",
      "cccdNumber",
      "cardNumber",
      "soCccd",
      "soCCCD",
    ]),
    cccdNumber: getStringValue(data, [
      "cccdNumber",
      "identityNumber",
      "idNumber",
      "citizenId",
      "cardNumber",
      "soCccd",
      "soCCCD",
    ]),
    sex: getStringValue(data, ["sex", "gender", "genderCode", "gioiTinh"]),
    gender: getStringValue(data, ["gender", "sex", "genderCode", "gioiTinh"]),
    nationality: getStringValue(data, ["nationality", "quocTich"]),
    address: getStringValue(data, [
      "address",
      "permanentAddress",
      "noiThuongTru",
    ]),
    issueDate: getStringValue(data, ["issueDate", "issuedDate", "ngayCap"]),
    issuePlace: getStringValue(data, ["issuePlace", "issuedPlace", "noiCap"]),
    expiryDate: getStringValue(data, [
      "expiryDate",
      "expiredDate",
      "ngayHetHan",
    ]),
    documentType: getStringValue(data, ["documentType", "idType", "loaiGiayTo"]),
    ocrData: data,
  };
}

export const useLoanOnboardingStore = create<LoanOnboardingStoreState>()(
  persist(
    (set, get) => ({
      applicationCode: "",
      currentStep: 1,
      ocrData: null,
      customerIdentifyData: null,
      selectedCustomer: null,
      phoneNumber: "",
      preliminaryInfoData: null,
      customerAssetDetailData: null,
      step3Data: null,
      assetData: null,
      references: initialReferencePersons,
      uploadedDocuments: [],
      selectedLoanProduct: null,
      loanRecommendation: null,

      step1CustomerIdentify: initialStep1CustomerIdentify,
      step2PreliminaryInfo: initialStep2PreliminaryInfo,

      setApplicationCode: (applicationCode) => {
        set((state) => ({
          applicationCode,
          step1CustomerIdentify: {
            ...state.step1CustomerIdentify,
            applicationCode,
            loanApplicationCode: applicationCode,
          },
          step2PreliminaryInfo: {
            ...state.step2PreliminaryInfo,
            applicationCode,
            loanApplicationCode: applicationCode,
          },
        }));
      },

      setCurrentStep: (currentStep) => {
        set({ currentStep });
      },

      setStep1CustomerIdentify: (data) => {
        set((state) => {
          const normalizedOcr = data.ocrData
            ? normalizeOcrData(data.ocrData)
            : {};
          const nextStep1 = {
            ...state.step1CustomerIdentify,
            ...normalizedOcr,
            ...data,
          };

          return {
            ocrData:
              (data.ocrData as Record<string, unknown> | undefined) ||
              state.ocrData,
            customerIdentifyData:
              data.customerCheckResult || state.customerIdentifyData,
            phoneNumber: nextStep1.phoneNumber || state.phoneNumber,
            step1CustomerIdentify: nextStep1,
          };
        });
      },

      setStep2PreliminaryInfo: (data) => {
        set((state) => {
          const nextStep2 = {
            ...state.step2PreliminaryInfo,
            ...data,
          };

          return {
            preliminaryInfoData: nextStep2,
            phoneNumber: nextStep2.phoneNumber || state.phoneNumber,
            step2PreliminaryInfo: nextStep2,
          };
        });
      },

      setCustomerIdentifyData: (customerIdentifyData) => {
        set((state) => ({
          customerIdentifyData,
          step1CustomerIdentify: {
            ...state.step1CustomerIdentify,
            customerCheckResult: customerIdentifyData,
          },
        }));
      },

      setOcrData: (ocrData) => {
        set((state) => ({
          ocrData,
          step1CustomerIdentify: {
            ...state.step1CustomerIdentify,
            ...normalizeOcrData(ocrData),
            ocrData,
          },
        }));
      },

      setPhoneNumber: (phoneNumber) => {
        set((state) => ({
          phoneNumber,
          step1CustomerIdentify: {
            ...state.step1CustomerIdentify,
            phoneNumber,
          },
          step2PreliminaryInfo: {
            ...state.step2PreliminaryInfo,
            phoneNumber: state.step2PreliminaryInfo.phoneNumber || phoneNumber,
          },
        }));
      },

      setSelectedCustomer: (selectedCustomer) => {
        set({ selectedCustomer });
      },

      setSelectedLoanProduct: (selectedLoanProduct) => {
        set({ selectedLoanProduct });
      },

      setCustomerAssetDetailData: (customerAssetDetailData) => {
        set({
          customerAssetDetailData,
          step3Data: customerAssetDetailData,
          assetData: customerAssetDetailData?.assetData || null,
          references:
            customerAssetDetailData?.references || initialReferencePersons,
        });
      },

      setStep3Data: (step3Data) => {
        get().setCustomerAssetDetailData(step3Data);
      },

      setAssetData: (assetData) => {
        set((state) => ({
          assetData,
          customerAssetDetailData: state.customerAssetDetailData
            ? {
                ...state.customerAssetDetailData,
                assetData: assetData || initialAssetData,
              }
            : state.customerAssetDetailData,
          step3Data: state.step3Data
            ? {
                ...state.step3Data,
                assetData: assetData || initialAssetData,
              }
            : state.step3Data,
        }));
      },

      setReferences: (references) => {
        set((state) => ({
          references,
          customerAssetDetailData: state.customerAssetDetailData
            ? {
                ...state.customerAssetDetailData,
                references,
              }
            : state.customerAssetDetailData,
          step3Data: state.step3Data
            ? {
                ...state.step3Data,
                references,
              }
            : state.step3Data,
        }));
      },

      setUploadedDocuments: (uploadedDocuments) => {
        set({ uploadedDocuments });
      },

      setLoanRecommendation: (loanRecommendation) => {
        set({ loanRecommendation });
      },

      prefillStep2FromStep1: () => {
        const { step1CustomerIdentify, step2PreliminaryInfo } = get();

        set({
          step2PreliminaryInfo: {
            ...step2PreliminaryInfo,

            fullName:
              step2PreliminaryInfo.fullName ||
              step1CustomerIdentify.fullName,

            identityNumber:
              step2PreliminaryInfo.identityNumber ||
              step1CustomerIdentify.identityNumber,

            phoneNumber:
              step2PreliminaryInfo.phoneNumber ||
              step1CustomerIdentify.phoneNumber,

            dateOfBirth:
              step2PreliminaryInfo.dateOfBirth ||
              step1CustomerIdentify.dateOfBirth,

            gender:
              step2PreliminaryInfo.gender ||
              step1CustomerIdentify.gender ||
              step1CustomerIdentify.sex,
          },
          preliminaryInfoData: {
            ...step2PreliminaryInfo,
            fullName:
              step2PreliminaryInfo.fullName ||
              step1CustomerIdentify.fullName,
            identityNumber:
              step2PreliminaryInfo.identityNumber ||
              step1CustomerIdentify.identityNumber,
            phoneNumber:
              step2PreliminaryInfo.phoneNumber ||
              step1CustomerIdentify.phoneNumber,
            dateOfBirth:
              step2PreliminaryInfo.dateOfBirth ||
              step1CustomerIdentify.dateOfBirth,
            gender:
              step2PreliminaryInfo.gender ||
              step1CustomerIdentify.gender ||
              step1CustomerIdentify.sex,
          },
        });
      },

      clearStep1CustomerIdentify: () => {
        set({
          ocrData: null,
          customerIdentifyData: null,
          selectedCustomer: null,
          phoneNumber: "",
          step1CustomerIdentify: initialStep1CustomerIdentify,
        });
      },

      clearStep2PreliminaryInfo: () => {
        set({
          preliminaryInfoData: null,
          selectedLoanProduct: null,
          loanRecommendation: null,
          step2PreliminaryInfo: initialStep2PreliminaryInfo,
        });
      },

      resetLoanOnboarding: () => {
        set({
          applicationCode: "",
          currentStep: 1,
          ocrData: null,
          customerIdentifyData: null,
          selectedCustomer: null,
          phoneNumber: "",
          preliminaryInfoData: null,
          customerAssetDetailData: null,
          step3Data: null,
          assetData: null,
          references: initialReferencePersons,
          uploadedDocuments: [],
          selectedLoanProduct: null,
          loanRecommendation: null,
          step1CustomerIdentify: initialStep1CustomerIdentify,
          step2PreliminaryInfo: initialStep2PreliminaryInfo,
        });
      },

      resetOnboarding: () => {
        get().resetLoanOnboarding();
      },
    }),
    {
      name: "f88-los-loan-onboarding-draft",
      version: 1,

      /**
       * Dùng sessionStorage:
       * - Reload trang: vẫn còn dữ liệu.
       * - Đóng tab / đóng trình duyệt: dữ liệu sẽ mất.
       */
      storage: createJSONStorage(() => sessionStorage),

      partialize: (state) => ({
        applicationCode: state.applicationCode,
        currentStep: state.currentStep,
        ocrData: state.ocrData,
        customerIdentifyData: state.customerIdentifyData,
        selectedCustomer: state.selectedCustomer,
        phoneNumber: state.phoneNumber,
        preliminaryInfoData: state.preliminaryInfoData,
        customerAssetDetailData: state.customerAssetDetailData,
        step3Data: state.step3Data,
        assetData: state.assetData,
        references: state.references,
        uploadedDocuments: state.uploadedDocuments,
        selectedLoanProduct: state.selectedLoanProduct,
        loanRecommendation: state.loanRecommendation,
        step1CustomerIdentify: state.step1CustomerIdentify,
        step2PreliminaryInfo: state.step2PreliminaryInfo,
      }),
    },
  ),
);

/**
 * Compatibility helpers.
 * Các hàm này KHÔNG còn dùng sessionStorage thủ công nữa.
 * Chúng đọc/ghi trực tiếp vào Zustand store.
 */

export function getStep1Identity(): Step1IdentityStorage | null {
  return useLoanOnboardingStore.getState().step1CustomerIdentify;
}

export function saveStep1Identity(data: Step1IdentityStorage) {
  useLoanOnboardingStore.getState().setStep1CustomerIdentify({
    fullName: data.fullName || "",
    dateOfBirth: data.dateOfBirth || "",
    phoneNumber: data.phoneNumber || "",
    identityNumber: data.identityNumber || "",

    customerId: String(data.customerId || ""),
    customerCode: String(data.customerCode || ""),
    applicationCode: String(data.applicationCode || ""),
    loanApplicationCode: String(data.loanApplicationCode || ""),
    loanApplicationId: String(data.loanApplicationId || ""),

    documentType: String(data.documentType || ""),
    sex: String(data.sex || ""),
    gender: String(data.gender || data.sex || ""),
    nationality: String(data.nationality || ""),
    issueDate: String(data.issueDate || ""),
    expiryDate: String(data.expiryDate || ""),

    lookupStatus: String(data.lookupStatus || ""),
    onboardingPermission: String(data.onboardingPermission || ""),
  });
}

export function clearStep1Identity() {
  useLoanOnboardingStore.getState().clearStep1CustomerIdentify();
}

export function getStep2PreliminaryInfo(): Step2PreliminaryInfoStorage | null {
  return useLoanOnboardingStore.getState().step2PreliminaryInfo;
}

export function saveStep2PreliminaryInfo(data: Step2PreliminaryInfoStorage) {
  useLoanOnboardingStore.getState().setStep2PreliminaryInfo({
    ...data,
    fullName: data.fullName || "",
    identityNumber: data.identityNumber || "",
    phoneNumber: data.phoneNumber || "",
    dateOfBirth: data.dateOfBirth || "",
    gender: data.gender || "",
    job: data.job || "",
    monthlyIncome: data.monthlyIncome || "",
    loanPurpose: data.loanPurpose || "",
    desiredLoanAmount: data.desiredLoanAmount || "",
    term: data.term || "12",
    assetType: data.assetType || "",
    brand: data.brand || "",
    model: data.model || "",
    version: data.version || "",
    manufactureYear: data.manufactureYear || "",
    color: data.color || "",
    selectedDeductionIds: data.selectedDeductionIds || [],
    selectedPackageId: data.selectedPackageId || "promotion",
    selectedTerm: data.selectedTerm || data.term || "12",
    selectedProductCode: data.selectedProductCode || "",
    recommendedProductCode: data.recommendedProductCode || "",
  });
}

export function clearStep2PreliminaryInfo() {
  useLoanOnboardingStore.getState().clearStep2PreliminaryInfo();
}

export function clearLoanOnboardingStorage() {
  useLoanOnboardingStore.getState().resetLoanOnboarding();
}

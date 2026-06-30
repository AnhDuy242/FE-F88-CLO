export type Step1IdentityData = {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  identityNumber?: string;
  customerId?: string;

  documentType?: string;
  sex?: string;
  nationality?: string;
  issueDate?: string;
  expiryDate?: string;
  placeOfOrigin?: string;
  placeOfResidence?: string;
};

export type Step2PreliminarySessionData = {
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
  plateNumber?: string;
  brand?: string;
  model?: string;
  version?: string;
  manufactureYear?: string;
  color?: string;

  selectedDeductionIds?: string[];
  selectedPackageId?: "standard" | "promotion" | "vip";
  selectedTerm?: string;
};

export type LoanOnboardingSessionData = {
  step1Identity?: Step1IdentityData;
  step2PreliminaryInfo?: Step2PreliminarySessionData;
};

const LOAN_ONBOARDING_SESSION_KEY = "F88_LOAN_ONBOARDING_SESSION";
const CUSTOMER_IDENTIFY_OCR_KEY = "customerIdentifyOcrData";

function convertDdMmYyyyToIsoDate(value?: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parts = value.split("/");

  if (parts.length !== 3) {
    return value;
  }

  const [day, month, year] = parts;

  if (!day || !month || !year) {
    return value;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getCustomerIdentifyOcrData(): Step1IdentityData | null {
  try {
    const rawData = sessionStorage.getItem(CUSTOMER_IDENTIFY_OCR_KEY);

    if (!rawData) {
      return null;
    }

    const ocrData = JSON.parse(rawData) as {
      fullName?: string;
      dateOfBirth?: string;
      dateOfBirthFormatted?: string;
      identityNumber?: string;
      phoneNumber?: string;
      sex?: string;
      gender?: string;
      documentType?: string;
      nationality?: string;
      issueDate?: string;
      expiryDate?: string;
      placeOfOrigin?: string;
      placeOfResidence?: string;
    };

    return {
      fullName: ocrData.fullName || "",
      identityNumber: ocrData.identityNumber || "",
      phoneNumber: ocrData.phoneNumber || "",
      dateOfBirth:
        ocrData.dateOfBirthFormatted ||
        convertDdMmYyyyToIsoDate(ocrData.dateOfBirth),
      sex: ocrData.sex || ocrData.gender || "",
      documentType: ocrData.documentType || "",
      nationality: ocrData.nationality || "",
      issueDate: ocrData.issueDate || "",
      expiryDate: ocrData.expiryDate || "",
      placeOfOrigin: ocrData.placeOfOrigin || "",
      placeOfResidence: ocrData.placeOfResidence || "",
    };
  } catch {
    return null;
  }
}

export function getLoanOnboardingSession(): LoanOnboardingSessionData {
  try {
    const rawData = sessionStorage.getItem(LOAN_ONBOARDING_SESSION_KEY);

    if (!rawData) {
      return {};
    }

    return JSON.parse(rawData) as LoanOnboardingSessionData;
  } catch {
    return {};
  }
}

export function saveLoanOnboardingSession(data: LoanOnboardingSessionData) {
  const currentSession = getLoanOnboardingSession();

  const nextSession: LoanOnboardingSessionData = {
    ...currentSession,

    step1Identity: {
      ...currentSession.step1Identity,
      ...data.step1Identity,
    },

    step2PreliminaryInfo: {
      ...currentSession.step2PreliminaryInfo,
      ...data.step2PreliminaryInfo,
    },
  };

  sessionStorage.setItem(
    LOAN_ONBOARDING_SESSION_KEY,
    JSON.stringify(nextSession)
  );
}

export function saveStep1Identity(data: Step1IdentityData) {
  saveLoanOnboardingSession({
    step1Identity: data,
  });
}

export function getStep1Identity(): Step1IdentityData | null {
  const session = getLoanOnboardingSession();

  if (session.step1Identity) {
    return session.step1Identity;
  }

  return getCustomerIdentifyOcrData();
}

export function saveStep2PreliminaryInfo(data: Step2PreliminarySessionData) {
  saveLoanOnboardingSession({
    step2PreliminaryInfo: data,
  });
}

export function getStep2PreliminaryInfo(): Step2PreliminarySessionData | null {
  const session = getLoanOnboardingSession();

  return session.step2PreliminaryInfo || null;
}

export function clearLoanOnboardingSession() {
  sessionStorage.removeItem(LOAN_ONBOARDING_SESSION_KEY);
  sessionStorage.removeItem(CUSTOMER_IDENTIFY_OCR_KEY);
}
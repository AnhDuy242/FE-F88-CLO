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
  brand?: string;
  model?: string;
  version?: string;
  manufactureYear?: string;
  color?: string;

  selectedDeductionIds?: string[];
  selectedPackageId?: "standard" | "promotion" | "vip";
  selectedTerm?: string;

  applicationCode?: string;
};

export type LoanOnboardingSessionData = {
  step1Identity?: Step1IdentityData;
  step2PreliminaryInfo?: Step2PreliminarySessionData;
};

type SessionStorageValue<T> = {
  data: T;
  expiresAt: number;
};

const LOAN_ONBOARDING_SESSION_KEY = "F88_LOAN_ONBOARDING_SESSION";
const CUSTOMER_IDENTIFY_OCR_KEY = "customerIdentifyOcrData";

const SESSION_TIMEOUT = 30 * 60 * 1000;

function getExpiresAt() {
  return Date.now() + SESSION_TIMEOUT;
}

function isExpired(expiresAt?: number) {
  if (!expiresAt) return false;

  return Date.now() > expiresAt;
}

function setSessionWithTimeout<T>(key: string, data: T) {
  const value: SessionStorageValue<T> = {
    data,
    expiresAt: getExpiresAt(),
  };

  sessionStorage.setItem(key, JSON.stringify(value));
}

function getSessionWithTimeout<T>(key: string): T | null {
  try {
    const rawData = sessionStorage.getItem(key);

    if (!rawData) {
      return null;
    }

    const parsedData = JSON.parse(rawData) as SessionStorageValue<T> | T;

    if (
      typeof parsedData === "object" &&
      parsedData !== null &&
      "data" in parsedData &&
      "expiresAt" in parsedData
    ) {
      const wrappedData = parsedData as SessionStorageValue<T>;

      if (isExpired(wrappedData.expiresAt)) {
        sessionStorage.removeItem(key);
        return null;
      }

      return wrappedData.data;
    }

    return parsedData as T;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

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
  const ocrData = getSessionWithTimeout<{
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
  }>(CUSTOMER_IDENTIFY_OCR_KEY);

  if (!ocrData) {
    return null;
  }

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
}

export function saveCustomerIdentifyOcrData(data: {
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
  savedAt?: string;
}) {
  setSessionWithTimeout(CUSTOMER_IDENTIFY_OCR_KEY, data);
}

export function getLoanOnboardingSession(): LoanOnboardingSessionData {
  const session = getSessionWithTimeout<LoanOnboardingSessionData>(
    LOAN_ONBOARDING_SESSION_KEY,
  );

  return session || {};
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

  setSessionWithTimeout(LOAN_ONBOARDING_SESSION_KEY, nextSession);
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

export function refreshLoanOnboardingSessionTimeout() {
  const session = getLoanOnboardingSession();

  if (Object.keys(session).length > 0) {
    setSessionWithTimeout(LOAN_ONBOARDING_SESSION_KEY, session);
  }

  const ocrData = getSessionWithTimeout(CUSTOMER_IDENTIFY_OCR_KEY);

  if (ocrData) {
    setSessionWithTimeout(CUSTOMER_IDENTIFY_OCR_KEY, ocrData);
  }
}

export function clearLoanOnboardingSession() {
  sessionStorage.removeItem(LOAN_ONBOARDING_SESSION_KEY);
  sessionStorage.removeItem(CUSTOMER_IDENTIFY_OCR_KEY);
}
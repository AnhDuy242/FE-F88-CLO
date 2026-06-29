export type Step1IdentityData = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  identityNumber: string;
  customerId?: string;
};

const STEP_1_IDENTITY_KEY = "F88_STEP_1_IDENTITY_DATA";

export function saveStep1Identity(data: Step1IdentityData) {
  sessionStorage.setItem(STEP_1_IDENTITY_KEY, JSON.stringify(data));
}

export function getStep1Identity(): Step1IdentityData | null {
  try {
    const rawData = sessionStorage.getItem(STEP_1_IDENTITY_KEY);

    if (!rawData) {
      return null;
    }

    return JSON.parse(rawData) as Step1IdentityData;
  } catch {
    return null;
  }
}

export function clearStep1Identity() {
  sessionStorage.removeItem(STEP_1_IDENTITY_KEY);
}
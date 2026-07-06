export type UploadSide = "front" | "back";

export type UploadedImage = {
  file: File;
  previewUrl: string;
};

export type CustomerOcrData = {
  fullName?: string;
  dateOfBirth?: string;
  identityNumber?: string;
  documentType?: string;
  sex?: string;
  nationality?: string;
  expiryDate?: string;
  issueDate?: string;
  frontImageProcessed?: boolean;
  backImageProcessed?: boolean;

  [key: string]: unknown;
};

export type CustomerIdentifyPayload = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  identityNumber: string;
  cccdFrontImage?: File;
  cccdBackImage?: File;
};

export type CustomerIdentifyLookupPayload = {
  fullName: string;
  dateOfBirth: string;
  identifierNumber: string;
  phoneNumber: string;
};

export type CreateCustomerPayload = {
  fullName: string;
  identifierNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
};

export type CreatedCustomerData = {
  customerCode: string;
  fullName: string;
  identifierNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  status: string;
};

export type CreateCustomerResponse = {
  success?: boolean;
  message?: string;
  data?: CreatedCustomerData;
  errorCode?: string | null;
  timestamp?: string;
};

export type MatchedCustomer = {
  customerId?: string;
  customerCode?: string;
  fullName?: string;
  dateOfBirth?: string;
  identifierType?: string;
  identifierNumber?: string;
  phoneNumber?: string;

  [key: string]: unknown;
};

export type CustomerIdentifyData = {
  found?: boolean;
  customerCode?: string;
  customerState?: string;
  customerStatus?: string;
  lookupStatus?: string;
  onboardingPermission?: string;
  matchedCustomer?: MatchedCustomer | null;
  reasonCode?: string;

  [key: string]: unknown;
};

export type CustomerIdentifyResponse = {
  success?: boolean;
  message?: string;
  data?: CustomerIdentifyData;
  errorCode?: string | null;
  timestamp?: string;

  isExistingCustomer?: boolean;
  isBlacklisted?: boolean;
  riskLevel?: string;
  customerId?: string;

  [key: string]: unknown;
};

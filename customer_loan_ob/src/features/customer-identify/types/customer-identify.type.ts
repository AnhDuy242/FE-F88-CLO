export type UploadSide = "front" | "back";

export type UploadedImage = {
  file: File;
  previewUrl: string;
};

export type CustomerIdentifyPayload = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  identityNumber: string;
  cccdFrontImage: File;
  cccdBackImage: File;
};

export type CustomerIdentifyResponse = {
  isExistingCustomer: boolean;
  isBlacklisted: boolean;
  riskLevel?: string;
  message: string;
  customerId?: string;
};

export type CustomerOcrPayload = {
  cccdFrontImage: File;
  cccdBackImage: File;
};

export type CustomerOcrData = {
  fullName: string;
  dateOfBirth: string;
  identityNumber: string;
  documentType: string;
  sex: string;
  nationality: string;
  expiryDate: string;
  issueDate: string;
  frontImageProcessed: boolean;
  backImageProcessed: boolean;
};

export type CustomerOcrResponse = {
  success: boolean;
  message: string;
  data: CustomerOcrData;
  errorCode: string | null;
  timestamp: string;
};
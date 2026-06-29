export type CustomerIdentifyPayload = {
  fullName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  identityNumber: string;
  cccdFrontImage: File;
  cccdBackImage: File;
};

export type CustomerIdentifyResponse = {
  customerId?: string;
  customerName?: string;
  isExistingCustomer: boolean;
  isBlacklisted?: boolean;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  message: string;
};

export type UploadedImage = {
  file: File;
  previewUrl: string;
};

export type UploadSide = "front" | "back";
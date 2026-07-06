import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

import type {
  CreateCustomerPayload,
  CreateCustomerResponse,
  CustomerIdentifyLookupPayload,
  CustomerIdentifyResponse,
  CustomerOcrData,
} from "@/features/customer-identify/types/customer-identify.type";

export type CustomerOcrResponse = {
  success: boolean;
  message: string;
  data: CustomerOcrData | null;
  errorCode?: string | null;
  timestamp?: string;
};

export type OcrCccdPayload = {
  cccdFrontImage: File;
  cccdBackImage?: File;
};

function normalizeJfifFile(file: File, fallbackName: string) {
  const fileName = file.name || fallbackName;
  const lowerFileName = fileName.toLowerCase();

  if (file.type === "image/jfif" || lowerFileName.endsWith(".jfif")) {
    const normalizedName = lowerFileName.endsWith(".jfif")
      ? fileName.replace(/\.jfif$/i, ".jpg")
      : `${fileName}.jpg`;

    return new File([file], normalizedName, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
  }

  return file;
}

function buildOcrFormData(payload: OcrCccdPayload) {
  const formData = new FormData();

  const frontImage = normalizeJfifFile(
    payload.cccdFrontImage,
    "cccd-front.jpg",
  );

  /**
   * Key chính theo BE đang dùng.
   */
  formData.append("frontImage", frontImage, frontImage.name);

  if (payload.cccdBackImage) {
    const backImage = normalizeJfifFile(
      payload.cccdBackImage,
      "cccd-back.jpg",
    );

    formData.append("backImage", backImage, backImage.name);
  }

  return formData;
}

function buildCustomerLookupPayload(payload: CustomerIdentifyLookupPayload) {
  return {
    fullName: payload.fullName.trim(),
    dateOfBirth: payload.dateOfBirth.trim(),
    identifierNumber: payload.identifierNumber.trim(),
    phoneNumber: payload.phoneNumber.trim(),
  };
}

function buildCreateCustomerPayload(payload: CreateCustomerPayload) {
  return {
    fullName: payload.fullName.trim(),
    identifierNumber: payload.identifierNumber.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    dateOfBirth: payload.dateOfBirth.trim(),
  };
}

export const customerIdentifyApi = {
  ocrCccd: async (payload: OcrCccdPayload): Promise<CustomerOcrResponse> => {
    const formData = buildOcrFormData(payload);

    /**
     * Không set Content-Type thủ công ở đây.
     * Browser/Axios sẽ tự set multipart/form-data kèm boundary.
     */
    return axiosClient.post<CustomerOcrResponse, CustomerOcrResponse>(
      API_ENDPOINTS.customerIdentify.ocrCccd,
      formData,
    );
  },

  checkCustomer: async (
    payload: CustomerIdentifyLookupPayload,
  ): Promise<CustomerIdentifyResponse> => {
    return axiosClient.post<CustomerIdentifyResponse, CustomerIdentifyResponse>(
      API_ENDPOINTS.customerIdentify.checkCustomer,
      buildCustomerLookupPayload(payload),
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },

  createCustomer: async (
    payload: CreateCustomerPayload,
  ): Promise<CreateCustomerResponse> => {
    return axiosClient.post<CreateCustomerResponse, CreateCustomerResponse>(
      API_ENDPOINTS.customerIdentify.createCustomer,
      buildCreateCustomerPayload(payload),
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
  },
};

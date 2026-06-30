import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  CustomerIdentifyPayload,
  CustomerIdentifyResponse,
  CustomerOcrPayload,
  CustomerOcrResponse,
} from "../types/customer-identify.type";

export const customerIdentifyApi = {
  ocrCccd: async (
    payload: CustomerOcrPayload
  ): Promise<CustomerOcrResponse> => {
    const formData = new FormData();

    formData.append("frontImage", payload.cccdFrontImage);
    formData.append("backImage", payload.cccdBackImage);

    return axiosClient.post<CustomerOcrResponse, CustomerOcrResponse, FormData>(
      API_ENDPOINTS.customerIdentify.ocrExtract,
      formData
    );
  },

  checkCustomer: async (
    payload: CustomerIdentifyPayload
  ): Promise<CustomerIdentifyResponse> => {
    const formData = new FormData();

    formData.append("fullName", payload.fullName);
    formData.append("dateOfBirth", payload.dateOfBirth);
    formData.append("phoneNumber", payload.phoneNumber || "");
    formData.append("identityNumber", payload.identityNumber);

    formData.append("frontImage", payload.cccdFrontImage);
    formData.append("backImage", payload.cccdBackImage);

    return axiosClient.post<
      CustomerIdentifyResponse,
      CustomerIdentifyResponse,
      FormData
    >(API_ENDPOINTS.customerIdentify.checkCustomer, formData);
  },
};
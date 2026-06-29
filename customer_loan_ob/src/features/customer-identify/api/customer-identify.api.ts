import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  CustomerIdentifyPayload,
  CustomerIdentifyResponse,
} from "../types/customer-identify.type";

export const customerIdentifyApi = {
  checkCustomer: async (
    payload: CustomerIdentifyPayload
  ): Promise<CustomerIdentifyResponse> => {
    const formData = new FormData();

    formData.append("fullName", payload.fullName);
    formData.append("dateOfBirth", payload.dateOfBirth);
    formData.append("phoneNumber", payload.phoneNumber || "");
    formData.append("identityNumber", payload.identityNumber);

    formData.append("cccdFrontImage", payload.cccdFrontImage);
    formData.append("cccdBackImage", payload.cccdBackImage);

    return axiosClient.post<
      CustomerIdentifyResponse,
      CustomerIdentifyResponse,
      FormData
    >(API_ENDPOINTS.customerIdentify.checkCustomer, formData);
  },
};
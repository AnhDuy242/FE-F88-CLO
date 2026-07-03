import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

import type {
  SaveAssetLegalInfoPayload,
  SaveAssetSnapshotPayload,
  SaveCustomerDetailPayload,
  SaveReferencePersonsPayload,
  SaveVehicleRegistrationPayload,
  Step3ApiResponse,
} from "@/features/customer-asset-detail/types/customer-asset-detail.type";

export const customerAssetDetailApi = {
  saveCustomerDetail: async (
    applicationCode: string,
    payload: SaveCustomerDetailPayload,
  ): Promise<Step3ApiResponse> => {
    return axiosClient.patch<Step3ApiResponse, Step3ApiResponse>(
      API_ENDPOINTS.loanApplication.saveCustomerDetail(applicationCode),
      payload,
    );
  },

  saveReferencePersons: async (
    applicationCode: string,
    payload: SaveReferencePersonsPayload,
  ): Promise<Step3ApiResponse> => {
    return axiosClient.put<Step3ApiResponse, Step3ApiResponse>(
      API_ENDPOINTS.loanApplication.saveReferencePersons(applicationCode),
      payload,
    );
  },

  saveAssetSnapshot: async (
    applicationCode: string,
    payload: SaveAssetSnapshotPayload,
  ): Promise<Step3ApiResponse> => {
    return axiosClient.patch<Step3ApiResponse, Step3ApiResponse>(
      API_ENDPOINTS.loanApplication.saveAssetSnapshot(applicationCode),
      payload,
    );
  },

  saveAssetLegalInfo: async (
    applicationCode: string,
    payload: SaveAssetLegalInfoPayload,
  ): Promise<Step3ApiResponse> => {
    return axiosClient.patch<Step3ApiResponse, Step3ApiResponse>(
      API_ENDPOINTS.loanApplication.saveAssetLegalInfo(applicationCode),
      payload,
    );
  },

  saveVehicleRegistration: async (
    applicationCode: string,
    payload: SaveVehicleRegistrationPayload,
  ): Promise<Step3ApiResponse> => {
    return axiosClient.patch<Step3ApiResponse, Step3ApiResponse>(
      API_ENDPOINTS.loanApplication.saveVehicleRegistration(applicationCode),
      payload,
    );
  },
};

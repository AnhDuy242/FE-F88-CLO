import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  AssetValuationPayload,
  AssetValuationResponse,
} from "../types/asset-valuation.type";

export const assetValuationApi = {
  preview: async (
    applicationCode: string,
    payload: AssetValuationPayload,
  ): Promise<AssetValuationResponse> => {
    return axiosClient.post<
      AssetValuationResponse,
      AssetValuationResponse,
      AssetValuationPayload
    >(API_ENDPOINTS.assetValuation.preview(applicationCode), payload);
  },

  savePreview: async (
    applicationCode: string,
    payload: AssetValuationPayload,
  ): Promise<AssetValuationResponse> => {
    return axiosClient.patch<
      AssetValuationResponse,
      AssetValuationResponse,
      AssetValuationPayload
    >(API_ENDPOINTS.assetValuation.savePreview(applicationCode), payload);
  },
};
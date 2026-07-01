import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  AssetValuationMarketPriceParams,
  AssetValuationMarketPriceResponse,
  AssetValuationPayload,
  AssetValuationResponse,
} from "../types/asset-valuation.type";

export const assetValuationApi = {
  getMarketPrice: async (
    params: AssetValuationMarketPriceParams,
  ): Promise<AssetValuationMarketPriceResponse> => {
    return axiosClient.get<
      AssetValuationMarketPriceResponse,
      AssetValuationMarketPriceResponse
    >(API_ENDPOINTS.assetValuation.marketPrice, {
      params,
    });
  },

  preview: async (
    payload: AssetValuationPayload,
  ): Promise<AssetValuationResponse> => {
    return axiosClient.post<
      AssetValuationResponse,
      AssetValuationResponse,
      AssetValuationPayload
    >(API_ENDPOINTS.assetValuation.preview, payload);
  },

  save: async (
    applicationCode: string,
    payload: AssetValuationPayload,
  ): Promise<AssetValuationResponse> => {
    return axiosClient.post<
      AssetValuationResponse,
      AssetValuationResponse,
      AssetValuationPayload
    >(API_ENDPOINTS.assetValuation.save(applicationCode), payload);
  },
};
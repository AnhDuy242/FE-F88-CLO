import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  ReferenceDataItem,
  ReferenceDataResponse,
} from "../types/reference-data.type";

type QueryParams = Record<string, string | number | boolean | undefined>;

export const referenceDataApi = {
  getAssetTypes: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.assetTypes,
      { params },
    );
  },

  getGenders: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.genders,
      { params },
    );
  },

  getLoanPurposes: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.loanPurposes,
      { params },
    );
  },

  getOccupations: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.occupations,
      { params },
    );
  },

  getManufactureYears: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.manufactureYears,
      { params },
    );
  },

  getVehicleBrands: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleBrands,
      { params },
    );
  },

  getVehicleModels: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleModels,
      { params },
    );
  },

  getVehicleVersions: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleVersions,
      { params },
    );
  },

  getVehicleVariants: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleVariants,
      { params },
    );
  },

  getVehicleVariant: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse<ReferenceDataItem>> => {
    return axiosClient.get<
      ReferenceDataResponse<ReferenceDataItem>,
      ReferenceDataResponse<ReferenceDataItem>
    >(API_ENDPOINTS.referenceData.vehicleVariant, { params });
  },

  getVehicleColors: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleColors,
      { params },
    );
  },

  getValuationDeductionFactors: async (
    params?: QueryParams,
  ): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.valuationDeductionFactors,
      { params },
    );
  },
};
import { axiosClient } from "@/lib/axios-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

import type {
  ReferenceDataItem,
  ReferenceDataResponse,
} from "../types/reference-data.type";

export const referenceDataApi = {
  getAssetTypes: async (): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.assetTypes,
    );
  },

  getGenders: async (): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.genders,
    );
  },

  getOccupations: async (): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.occupations,
    );
  },

  getLoanPurposes: async (): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.loanPurposes,
    );
  },

  getVehicleBrands: async (params: {
    assetType: string;
  }): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleBrands,
      { params },
    );
  },

  getVehicleModels: async (params: {
    brandCode: string;
  }): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleModels,
      { params },
    );
  },

  getVehicleVersions: async (params: {
    modelCode: string;
  }): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleVersions,
      { params },
    );
  },

  getManufactureYears: async (params: {
    modelCode: string;
    versionCode: string;
  }): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.manufactureYears,
      { params },
    );
  },

  getVehicleColors: async (params: {
    modelCode: string;
    versionCode: string;
    manufactureYear: number;
  }): Promise<ReferenceDataResponse> => {
    return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
      API_ENDPOINTS.referenceData.vehicleColors,
      { params },
    );
  },

  getVehicleVariant: async (params: {
    modelCode: string;
    versionCode: string;
    manufactureYear: number;
    colorCode: string;
  }): Promise<ReferenceDataResponse<ReferenceDataItem>> => {
    return axiosClient.get<
      ReferenceDataResponse<ReferenceDataItem>,
      ReferenceDataResponse<ReferenceDataItem>
    >(API_ENDPOINTS.referenceData.vehicleVariant, { params });
  },

  getValuationDeductionFactors:
    async (): Promise<ReferenceDataResponse> => {
      return axiosClient.get<ReferenceDataResponse, ReferenceDataResponse>(
        API_ENDPOINTS.referenceData.valuationDeductionFactors,
      );
    },
};
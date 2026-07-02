import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { axiosClient } from "@/lib/axios-client";

export const referenceDataApi = {
  getAssetTypes: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.assetTypes);
  },

  getGenders: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.genders);
  },

  getMaritalStatuses: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.maritalStatuses);
  },

  getOccupations: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.occupations);
  },

  getIncomeSources: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.incomeSources);
  },

  getBanks: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.banks);
  },

  getReferencePersonRelationships: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.referencePersonRelationships);
  },

  getLoanPurposes: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.loanPurposes);
  },

  getLoanTerms: async () => {
    return axiosClient.get(API_ENDPOINTS.referenceData.loanTerms);
  },

  getVehicleBrands: async (params: { assetType: "MOTORBIKE" | "CAR" }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.vehicleBrands, {
      params,
    });
  },

  getVehicleModels: async (params: { brandCode: string }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.vehicleModels, {
      params,
    });
  },

  getVehicleVersions: async (params: { modelCode: string }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.vehicleVersions, {
      params,
    });
  },

  getManufactureYears: async (params: {
    modelCode: string;
    versionCode: string;
  }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.manufactureYears, {
      params,
    });
  },

  getVehicleColors: async (params: {
    modelCode: string;
    versionCode: string;
    manufactureYear: number;
  }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.vehicleColors, {
      params,
    });
  },

  getVehicleVariant: async (params: {
    modelCode: string;
    versionCode: string;
    manufactureYear: number;
    colorCode: string;
  }) => {
    return axiosClient.get(API_ENDPOINTS.referenceData.vehicleVariant, {
      params,
    });
  },

  getValuationDeductionFactors: async () => {
    return axiosClient.get(
      API_ENDPOINTS.referenceData.valuationDeductionFactors,
    );
  },
};

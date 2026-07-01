export type ReferenceDataItem = {
  id?: string | number;

  code?: string | number;
  value?: string | number;
  name?: string;
  label?: string;
  displayName?: string;
  description?: string;

  type?: string;
  rate?: number;
  percent?: number;
  deductionRate?: number;
  deductionPercent?: number;

  occupation?: string;
  occupationCode?: string;
  occupationName?: string;
  job?: string;
  jobCode?: string;
  jobName?: string;

  assetType?: string;
  assetTypeCode?: string;
  assetTypeName?: string;

  brand?: string;
  brandCode?: string;
  brandName?: string;

  model?: string;
  modelCode?: string;
  modelName?: string;

  version?: string;
  versionCode?: string;
  versionName?: string;

  vehicleVersion?: string;
  vehicleVersionCode?: string;
  vehicleVersionName?: string;

  vehicleVariant?: string;
  vehicleVariantCode?: string;
  vehicleVariantName?: string;

  year?: string | number;
  manufactureYear?: string | number;

  color?: string;
  colorCode?: string;
  colorName?: string;

  vehicleColor?: string;
  vehicleColorCode?: string;
  vehicleColorName?: string;
};

export type ReferenceDataResponse<T = ReferenceDataItem> = {
  success?: boolean;
  message?: string;
  data?: T[] | T;
  errorCode?: string | null;
  timestamp?: string;
};

export type ReferenceOption = {
  label: string;
  value: string;
};
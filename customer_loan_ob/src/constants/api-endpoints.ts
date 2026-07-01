export const API_ENDPOINTS = {
  customerIdentify: {
    checkCustomer: "/customers/check",
    ocrCccd: "/customers/ocr/extract",
  },

  preliminaryInfo: {
    saveDraft: "/loan-applications/preliminary-info/draft",
    submit: "/loan-applications/preliminary-info",
  },

  assetValuation: {
    marketPrice: "/asset-valuations/market-price",
    preview: "/asset-valuations/preview",
    save: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/asset-valuations`,
  },

  loanProductRecommendation: {
    recommend: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/loan-product-recommendations`,
  },

  referenceData: {
    assetTypes: "/reference-data/asset-types",
    genders: "/reference-data/genders",
    occupations: "/reference-data/occupations",
    loanPurposes: "/reference-data/loan-purposes",

    vehicleBrands: "/reference-data/vehicle-brands",
    vehicleModels: "/reference-data/vehicle-models",
    vehicleVersions: "/reference-data/vehicle-versions",
    manufactureYears: "/reference-data/manufacture-years",
    vehicleColors: "/reference-data/vehicle-colors",
    vehicleVariant: "/reference-data/vehicle-variant",

    valuationDeductionFactors:
      "/reference-data/valuation-deduction-factors",
  },
} as const;
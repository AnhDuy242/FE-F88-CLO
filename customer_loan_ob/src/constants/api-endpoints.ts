export const API_ENDPOINTS = {
   customerIdentify: {
    checkCustomer: "/customer-identify/check",
    ocrExtract: "/customers/ocr/extract",
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

  referenceData: {
    assetTypes: "/reference-data/asset-types",
    genders: "/reference-data/genders",
    loanPurposes: "/reference-data/loan-purposes",
    occupations: "/reference-data/occupations",
    manufactureYears: "/reference-data/manufacture-years",

    vehicleBrands: "/reference-data/vehicle-brands",
    vehicleModels: "/reference-data/vehicle-models",
    vehicleVersions: "/reference-data/vehicle-versions",
    vehicleVariants: "/reference-data/vehicle-variants",
    vehicleVariant: "/reference-data/vehicle-variant",
    vehicleColors: "/reference-data/vehicle-colors",

    valuationDeductionFactors:
      "/reference-data/valuation-deduction-factors",
  },
} as const;
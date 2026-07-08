export const API_ENDPOINTS = {
  customerIdentify: {
    checkCustomer: "/customers/lookup",
    createCustomer: "/customers",
    ocrCccd: "/customers/ocr/extract",
  },

  loanApplication: {
    createDraft: "/loan-applications",
    detail: (applicationCode: string) => `/loan-applications/${applicationCode}`,
    saveDraft: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/draft`,
    saveCustomerDetail: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/customer-detail`,
    saveReferencePersons: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/reference-persons`,
    saveAssetSnapshot: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/asset-snapshot`,
    saveAssetLegalInfo: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/asset-legal-info`,
    saveVehicleRegistration: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/vehicle-registration`,
    completePreliminaryStep: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/steps/preliminary/complete`,
    submitForApproval: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/submit-for-approval`,
  },

  loanApplicationDraft: {
    create: "/loan-application-drafts",
    overview: (draftCode: string) => `/loan-application-drafts/${draftCode}`,
    step: (draftCode: string, stepCode: string) =>
      `/loan-application-drafts/${draftCode}/steps/${stepCode}`,
    completeStep: (draftCode: string, stepCode: string) =>
      `/loan-application-drafts/${draftCode}/steps/${stepCode}/complete`,
    documentRequirements: (draftCode: string) =>
      `/loan-application-drafts/${draftCode}/documents/requirements`,
    uploadDocument: (draftCode: string, documentCode: string) =>
      `/loan-application-drafts/${draftCode}/documents/${documentCode}`,
    submit: (draftCode: string) => `/loan-application-drafts/${draftCode}/submit`,
  },

  preliminaryInfo: {
    saveDraft: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/draft`,
    submit: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/steps/preliminary/complete`,
  },

  assetValuation: {
    marketPrice: "/asset-valuations/market-price",
    preview: "/asset-valuations/preview",
    save: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/asset-valuations`,
  },

  creditScoring: {
    calculate: "/credit-scoring/calculate",
  },

  loanProductRecommendation: {
    recommend: "/loan-products/recommendations",
    recommendByApplication: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/loan-product-recommendations`,
    previewFinalOffer: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/final-loan-offer/preview`,
    selectFinalOffer: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/final-loan-offer/select`,
  },

  referenceData: {
    assetTypes: "/reference-data/asset-types",
    genders: "/reference-data/genders",
    maritalStatuses: "/reference-data/marital-statuses",
    occupations: "/reference-data/occupations",
    incomeSources: "/reference-data/income-sources",
    banks: "/reference-data/banks",
    referencePersonRelationships: "/reference-data/reference-person-relationships",
    loanPurposes: "/reference-data/loan-purposes",
    loanTerms: "/reference-data/loan-terms",

    vehicleBrands: "/reference-data/vehicle-brands",
    vehicleModels: "/reference-data/vehicle-models",
    vehicleVersions: "/reference-data/vehicle-versions",
    manufactureYears: "/reference-data/manufacture-years",
    vehicleColors: "/reference-data/vehicle-colors",
    vehicleVariant: "/reference-data/vehicle-variant",

    valuationDeductionFactors: "/reference-data/valuation-deduction-factors",
  },
} as const;

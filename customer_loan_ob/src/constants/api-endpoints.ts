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
    preview: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/asset-valuations/preview`,

    savePreview: (applicationCode: string) =>
      `/loan-applications/${applicationCode}/valuation-preview`,
  },
} as const;
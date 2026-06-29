export const API_ENDPOINTS = {
  customerIdentify: {
    checkCustomer: "/customer-identify/check",
    ocrCccd: "/customer-identify/ocr-cccd",
  },

  preliminaryInfo: {
    saveDraft: "/loan-applications/preliminary-info/draft",
    submit: "/loan-applications/preliminary-info",
  },
} as const;
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Car, User } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { onlyDigits, parseMoneyInput } from "@/lib/currency";
import {
  normalizeDateForDisplay,
  parseDisplayDateToApi,
  parseDateValue,
} from "@/lib/date";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";
import { SectionCard } from "@/features/preliminary-info/components/SectionCard";
import {
  CustomerAssetDateField,
  CustomerAssetSelectField,
  CustomerAssetTextField,
} from "@/features/customer-asset-detail/components/CustomerAssetFields";
import { LoanRecommendationPanel } from "@/features/customer-asset-detail/components/LoanRecommendationPanel";
import { mapCustomerRiskScoring } from "@/features/customer-asset-detail/utils/customer-risk-scoring.mapper";
import {
  customerAssetDetailSchema,
  type CustomerAssetDetailFormValues,
} from "@/features/customer-asset-detail/schemas/customer-asset-detail.schema";
import type { ReferenceOption } from "@/features/customer-asset-detail/types/customer-asset-detail.type";
import {
  initialAssetData,
  initialCustomerAssetDetailData,
  initialReferencePersons,
  useLoanOnboardingStore,
  type CustomerAssetDetailState,
  type ReferencePersonState,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import { referenceDataApi } from "@/features/preliminary-info/api/reference-data.api";
import { assetValuationApi } from "@/features/preliminary-info/api/asset-valuation.api";
import { loanProductRecommendationApi } from "@/features/preliminary-info/api/loan-product-recommendation.api";
import {
  creditScoringApi,
  type CreditScoringCalculateData,
} from "@/features/customer-asset-detail/api/credit-scoring.api";
import {
  LOAN_APPLICATION_DRAFT_STEPS,
  loanApplicationDraftApi,
} from "@/features/loan-onboarding/api/loan-application-draft.api";
import { useDraftStepAutosave } from "@/features/loan-onboarding/hooks/use-draft-step-autosave";
import type { DeductionItem } from "@/features/preliminary-info/types/preliminary-info.type";
import type { LoanProductRecommendationProduct } from "@/features/preliminary-info/types/loan-product-recommendation.type";

export const Route = createFileRoute("/loan/customer-asset-detail")({
  component: CustomerAssetDetailScreen,
});

const CURRENT_STEP = 3;

function getStringFromUnknownObject(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return "";

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getNumberFromUnknownObject(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return 0;

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const normalizedValue = Number(value.replace(/[^\d.-]/g, ""));

      if (Number.isFinite(normalizedValue)) {
        return normalizedValue;
      }
    }
  }

  return 0;
}

function getDigitsOnly(value?: string) {
  return onlyDigits(value);
}

function normalizeRegistrationDateForDisplay(value?: string) {
  return normalizeDateForDisplay(value);
}

function normalizeRegistrationDateForApi(value?: string) {
  return parseDisplayDateToApi(value);
}

function normalizeGender(value?: string) {
  if (!value) return "";

  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue === "NAM" || normalizedValue === "MALE") return "MALE";
  if (
    normalizedValue === "NU" ||
    normalizedValue === "NỮ" ||
    normalizedValue === "FEMALE"
  ) {
    return "FEMALE";
  }

  return normalizedValue;
}

function normalizeAssetType(value?: string): "MOTORBIKE" | "CAR" {
  const normalizedValue = (value || "").trim().toUpperCase();

  if (normalizedValue === "CAR" || normalizedValue === "OTO") {
    return "CAR";
  }

  return "MOTORBIKE";
}

function calculateAge(value?: string) {
  const birthDate = parseDateValue(value);

  if (!birthDate) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getReferenceItems(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) return response as Record<string, unknown>[];

  if (!response || typeof response !== "object") return [];

  const raw = response as {
    data?: unknown;
    content?: unknown;
    items?: unknown;
    records?: unknown;
    list?: unknown;
  };

  if (Array.isArray(raw.data)) return raw.data as Record<string, unknown>[];

  if (raw.data && typeof raw.data === "object") {
    const nested = raw.data as {
      data?: unknown;
      content?: unknown;
      items?: unknown;
      records?: unknown;
      list?: unknown;
    };

    if (Array.isArray(nested.data)) return nested.data as Record<string, unknown>[];
    if (Array.isArray(nested.content)) return nested.content as Record<string, unknown>[];
    if (Array.isArray(nested.items)) return nested.items as Record<string, unknown>[];
    if (Array.isArray(nested.records)) return nested.records as Record<string, unknown>[];
    if (Array.isArray(nested.list)) return nested.list as Record<string, unknown>[];

    return [raw.data as Record<string, unknown>];
  }

  if (Array.isArray(raw.content)) return raw.content as Record<string, unknown>[];
  if (Array.isArray(raw.items)) return raw.items as Record<string, unknown>[];
  if (Array.isArray(raw.records)) return raw.records as Record<string, unknown>[];
  if (Array.isArray(raw.list)) return raw.list as Record<string, unknown>[];

  return [];
}

function mapReferenceOptions(response: unknown): ReferenceOption[] {
  return getReferenceItems(response)
    .map((item) => {
      const value =
        item.code ??
        item.value ??
        item.id ??
        item.brandCode ??
        item.modelCode ??
        item.versionCode ??
        item.colorCode ??
        item.year ??
        "";
      const label =
        item.name ??
        item.label ??
        item.displayName ??
        item.description ??
        item.code ??
        item.value ??
        item.id ??
        "";

      return {
        value: String(value),
        label: String(label),
        description:
          typeof item.description === "string" ? item.description : null,
      };
    })
    .filter((item) => item.value && item.label);
}

function mapDeductionItems(response: unknown): DeductionItem[] {
  return getReferenceItems(response)
    .map((item) => ({
      id: String(item.code ?? item.value ?? item.id ?? ""),
      label: String(item.name ?? item.label ?? item.description ?? ""),
      percent: Number(item.rate ?? item.percent ?? item.description ?? 0),
    }))
    .filter((item) => item.id && item.label);
}

function getStoredReferencePersons(
  references?: ReferencePersonState[],
): ReferencePersonState[] {
  const source = references && references.length > 0
    ? references
    : initialReferencePersons;

  return source.map((item) => ({
    fullName: item.fullName || "",
    relationshipType: item.relationshipType || "",
    phoneNumber: item.phoneNumber || "",
    address: item.address || "",
    note: item.note || "",
  }));
}

function getCompleteReferencePersons(
  references: CustomerAssetDetailFormValues["references"],
): ReferencePersonState[] {
  return references
    .map((item) => ({
      fullName: item.fullName?.trim() || "",
      relationshipType: item.relationshipType?.trim() || "",
      phoneNumber: item.phoneNumber?.trim() || "",
      address: item.address?.trim() || "",
      note: item.note?.trim() || "",
    }))
    .filter((item) => item.fullName && item.relationshipType && item.phoneNumber);
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") return message;
  }

  return "Không thể lưu chi tiết khách hàng và tài sản.";
}

function CustomerAssetDetailScreen() {
  const navigate = useNavigate();

  const selectedCustomer = useLoanOnboardingStore(
    (state) => state.selectedCustomer,
  );
  const step1Identity = useLoanOnboardingStore(
    (state) => state.step1CustomerIdentify,
  );
  const step2PreliminaryInfo = useLoanOnboardingStore(
    (state) => state.step2PreliminaryInfo,
  );
  const step3Data = useLoanOnboardingStore((state) => state.step3Data);
  const storedLoanRecommendation = useLoanOnboardingStore(
    (state) => state.loanRecommendation,
  );
  const selectedLoanProduct = useLoanOnboardingStore(
    (state) => state.selectedLoanProduct,
  );
  const applicationCode = useLoanOnboardingStore(
    (state) => state.applicationCode,
  );
  const draftCode = useLoanOnboardingStore((state) => state.draftCode);
  const setDraftInfo = useLoanOnboardingStore((state) => state.setDraftInfo);
  const setCurrentStep = useLoanOnboardingStore((state) => state.setCurrentStep);
  const setCustomerAssetDetailData = useLoanOnboardingStore(
    (state) => state.setCustomerAssetDetailData,
  );
  const setAssetData = useLoanOnboardingStore((state) => state.setAssetData);
  const setReferences = useLoanOnboardingStore((state) => state.setReferences);
  const setLoanRecommendation = useLoanOnboardingStore(
    (state) => state.setLoanRecommendation,
  );
  const setSelectedLoanProduct = useLoanOnboardingStore(
    (state) => state.setSelectedLoanProduct,
  );

  const selectedCustomerData = selectedCustomer as Record<string, unknown> | null;
  const selectedLoanProductData =
    selectedLoanProduct as Record<string, unknown> | null;
  const hasAutoFilledCustomerInfo = Boolean(
    step3Data?.fullName ||
      step2PreliminaryInfo.fullName ||
      step1Identity.fullName ||
      selectedCustomerData,
  );

  const defaultReferences = getStoredReferencePersons(step3Data?.references);
  const defaultAsset = step3Data?.assetData || initialAssetData;

  const form = useForm<CustomerAssetDetailFormValues>({
    resolver: zodResolver(customerAssetDetailSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fullName:
        step3Data?.fullName ||
        getStringFromUnknownObject(selectedCustomerData, ["fullName"]) ||
        step2PreliminaryInfo.fullName ||
        step1Identity.fullName ||
        "",
      identityNumber:
        step3Data?.identityNumber ||
        getStringFromUnknownObject(selectedCustomerData, [
          "identifierNumber",
          "identityNumber",
          "cccdNumber",
        ]) ||
        step2PreliminaryInfo.identityNumber ||
        step1Identity.identityNumber ||
        "",
      phoneNumber:
        step3Data?.phoneNumber ||
        getStringFromUnknownObject(selectedCustomerData, ["phoneNumber"]) ||
        step2PreliminaryInfo.phoneNumber ||
        step1Identity.phoneNumber ||
        "",
      dateOfBirth:
        normalizeDateForDisplay(
          step3Data?.dateOfBirth ||
            getStringFromUnknownObject(selectedCustomerData, [
              "dateOfBirth",
              "birthDate",
            ]) ||
            step2PreliminaryInfo.dateOfBirth ||
            step1Identity.dateOfBirth,
        ) || "",
      gender:
        step3Data?.gender ||
        normalizeGender(
          getStringFromUnknownObject(selectedCustomerData, ["gender", "sex"]) ||
            step2PreliminaryInfo.gender ||
            step1Identity.gender ||
            step1Identity.sex,
        ),
      email: step3Data?.email || "",
      maritalStatus: step3Data?.maritalStatus || "",
      dependentCount: step3Data?.dependentCount || "",
      occupationCode:
        step3Data?.occupationCode || step2PreliminaryInfo.job || "",
      workplaceName: step3Data?.workplaceName || "",
      incomeSourceCode: step3Data?.incomeSourceCode || "",
      monthlyIncomeAmount: getDigitsOnly(
        step3Data?.monthlyIncomeAmount ||
          step2PreliminaryInfo.monthlyIncome ||
          "",
      ),
      disbursementBankCode: step3Data?.disbursementBankCode || "",
      disbursementAccountNumber: step3Data?.disbursementAccountNumber || "",
      disbursementAccountName: step3Data?.disbursementAccountName || "",
      permanentAddress:
        step3Data?.permanentAddress ||
        getStringFromUnknownObject(selectedCustomerData, [
          "permanentAddress",
          "address",
        ]) ||
        step1Identity.address ||
        "",
      currentAddress:
        step3Data?.currentAddress ||
        getStringFromUnknownObject(selectedCustomerData, [
          "currentAddress",
          "address",
        ]) ||
        step1Identity.address ||
        "",
      references: defaultReferences,

      assetType: defaultAsset.assetType || step2PreliminaryInfo.assetType || "",
      licensePlate: defaultAsset.licensePlate || "",
      brand: defaultAsset.brand || step2PreliminaryInfo.brand || "",
      model: defaultAsset.model || step2PreliminaryInfo.model || "",
      version: defaultAsset.version || step2PreliminaryInfo.version || "",
      vehicleVariant: defaultAsset.vehicleVariant || "",
      manufactureYear:
        defaultAsset.manufactureYear ||
        step2PreliminaryInfo.manufactureYear ||
        "",
      vehicleColor: defaultAsset.vehicleColor || step2PreliminaryInfo.color || "",
      selectedDeductionIds:
        step3Data?.assetData.selectedDeductionIds ||
        step2PreliminaryInfo.selectedDeductionIds ||
        [],

      frameNumber: defaultAsset.frameNumber || "",
      engineNumber: defaultAsset.engineNumber || "",
      vehicleOwnerName: defaultAsset.vehicleOwnerName || "",
      registrationNumber: defaultAsset.registrationNumber || "",
      registrationIssueDate: normalizeRegistrationDateForDisplay(
        defaultAsset.registrationIssueDate,
      ),
      selectedLoanProductCode:
        step3Data?.selectedLoanProductCode ||
        getStringFromUnknownObject(selectedLoanProductData, ["productCode"]) ||
        step2PreliminaryInfo.selectedProductCode ||
        "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "references",
  });

  const [
    watchedAssetType,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedVehicleColor,
    watchedVehicleVariant,
    watchedSelectedDeductionIds,
    watchedDateOfBirth,
    watchedDependentCount,
    watchedMonthlyIncomeAmount,
  ] = useWatch({
    control: form.control,
    name: [
      "assetType",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "vehicleColor",
      "vehicleVariant",
      "selectedDeductionIds",
      "dateOfBirth",
      "dependentCount",
      "monthlyIncomeAmount",
    ],
  });
  const watchedFormValues = useWatch({
    control: form.control,
  }) as Partial<CustomerAssetDetailFormValues>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [recommendationOpen, setRecommendationOpen] = useState(true);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<
    LoanProductRecommendationProduct[]
  >(() => {
    const rawProducts = storedLoanRecommendation?.products;

    return Array.isArray(rawProducts)
      ? (rawProducts as LoanProductRecommendationProduct[])
      : [];
  });
  const [recommendedProductCode, setRecommendedProductCode] = useState(
    getStringFromUnknownObject(storedLoanRecommendation, [
      "recommendedProductCode",
    ]),
  );
  const [selectedProductCode, setSelectedProductCode] = useState(
    form.getValues("selectedLoanProductCode") || recommendedProductCode,
  );
  const [finalOfferPreview, setFinalOfferPreview] =
    useState<Record<string, unknown> | null>(null);
  const [creditScoring, setCreditScoring] =
    useState<CreditScoringCalculateData | null>(null);
  const [creditScoringError, setCreditScoringError] = useState("");
  const recommendationSignatureRef = useRef("");

  const storedPaymentMethod =
    getStringFromUnknownObject(step2PreliminaryInfo, [
      "paymentMethod",
      "paymentMethodCode",
      "repaymentMethod",
    ]) ||
    getStringFromUnknownObject(selectedLoanProductData, ["paymentMethod"]) ||
    getStringFromUnknownObject(storedLoanRecommendation, ["paymentMethod"]);
  const storedMonthlyPaymentDay =
    getNumberFromUnknownObject(step2PreliminaryInfo, ["monthlyPaymentDay"]) ||
    getNumberFromUnknownObject(selectedLoanProductData, ["monthlyPaymentDay"]) ||
    getNumberFromUnknownObject(storedLoanRecommendation, ["monthlyPaymentDay"]);
  const storedProcessingBranch =
    getStringFromUnknownObject(step2PreliminaryInfo, [
      "processingBranch",
      "branchName",
      "branchCode",
    ]) ||
    getStringFromUnknownObject(selectedCustomerData, [
      "processingBranch",
      "branchName",
      "branchCode",
    ]) ||
    getStringFromUnknownObject(step1Identity, [
      "processingBranch",
      "branchName",
      "branchCode",
    ]) ||
    getStringFromUnknownObject(selectedLoanProductData, [
      "processingBranch",
      "branchName",
      "branchCode",
    ]) ||
    getStringFromUnknownObject(storedLoanRecommendation, [
      "processingBranch",
      "branchName",
      "branchCode",
    ]);
  const [genderOptions, setGenderOptions] = useState<ReferenceOption[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<
    ReferenceOption[]
  >([]);
  const [occupationOptions, setOccupationOptions] = useState<ReferenceOption[]>(
    [],
  );
  const [incomeSourceOptions, setIncomeSourceOptions] = useState<
    ReferenceOption[]
  >([]);
  const [bankOptions, setBankOptions] = useState<ReferenceOption[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<
    ReferenceOption[]
  >([]);
  const [assetTypeOptions, setAssetTypeOptions] = useState<ReferenceOption[]>(
    [],
  );
  const [vehicleBrandOptions, setVehicleBrandOptions] = useState<
    ReferenceOption[]
  >([]);
  const [vehicleModelOptions, setVehicleModelOptions] = useState<
    ReferenceOption[]
  >([]);
  const [vehicleVersionOptions, setVehicleVersionOptions] = useState<
    ReferenceOption[]
  >([]);
  const [manufactureYearOptions, setManufactureYearOptions] = useState<
    ReferenceOption[]
  >([]);
  const [vehicleColorOptions, setVehicleColorOptions] = useState<
    ReferenceOption[]
  >([]);
  const [deductionOptions, setDeductionOptions] = useState<DeductionItem[]>([]);

  useEffect(() => {
    setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  useEffect(() => {
    if (!selectedProductCode) return;

    form.setValue("selectedLoanProductCode", selectedProductCode, {
      shouldDirty: false,
    });
  }, [form, selectedProductCode]);

  useEffect(() => {
    const requestedAmount = parseMoneyInput(
      step2PreliminaryInfo.desiredLoanAmount,
    ) ?? 0;
    const loanTermMonths = Number(
      step2PreliminaryInfo.term || step2PreliminaryInfo.selectedTerm || 0,
    );

    if (!applicationCode || requestedAmount <= 0 || loanTermMonths <= 0) {
      setFinalOfferPreview(null);
      return;
    }

    let isMounted = true;

    const loadFinalOfferPreview = async () => {
      try {
        const response = await loanProductRecommendationApi.previewFinalOffer(
          applicationCode,
          {
            requestedAmount,
            loanTermMonths,
            paymentMethod: storedPaymentMethod || undefined,
            monthlyPaymentDay:
              storedMonthlyPaymentDay > 0 ? storedMonthlyPaymentDay : undefined,
            processingBranch: storedProcessingBranch || undefined,
            limit: 3,
          },
        );

        if (!isMounted) return;

        setFinalOfferPreview((response.data || response) as Record<string, unknown>);
      } catch (error) {
        console.error("Final offer preview error:", error);

        if (!isMounted) return;

        setFinalOfferPreview(null);
      }
    };

    void loadFinalOfferPreview();

    return () => {
      isMounted = false;
    };
  }, [
    applicationCode,
    step2PreliminaryInfo.desiredLoanAmount,
    storedMonthlyPaymentDay,
    storedPaymentMethod,
    storedProcessingBranch,
    step2PreliminaryInfo.selectedTerm,
    step2PreliminaryInfo.term,
  ]);

  useEffect(() => {
    const monthlyIncomeAmount = parseMoneyInput(watchedMonthlyIncomeAmount) ?? 0;
    const age = calculateAge(watchedDateOfBirth);
    const dependentCount =
      watchedDependentCount === "" || watchedDependentCount === undefined
        ? 0
        : Number(watchedDependentCount);

    if (
      monthlyIncomeAmount <= 0 ||
      age < 18 ||
      !Number.isInteger(dependentCount) ||
      dependentCount < 0
    ) {
      setCreditScoring(null);
      setCreditScoringError("");
      return;
    }

    let isMounted = true;

    const timer = setTimeout(() => {
      void creditScoringApi
        .calculate({
          monthlyIncomeAmount,
          age,
          dependentCount,
        })
        .then((response) => {
          if (!isMounted) return;

          setCreditScoring(response.data || null);
          setCreditScoringError("");
        })
        .catch((error) => {
          console.error("Credit scoring error:", error);

          if (!isMounted) return;

          setCreditScoring(null);
          setCreditScoringError("Không thể lấy dữ liệu scoring từ backend.");
        });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [watchedDateOfBirth, watchedDependentCount, watchedMonthlyIncomeAmount]);

  useEffect(() => {
    const loadReferenceData = async () => {
      const [
        genders,
        maritalStatuses,
        occupations,
        incomeSources,
        banks,
        relationships,
        assetTypes,
        deductions,
      ] = await Promise.allSettled([
        referenceDataApi.getGenders(),
        referenceDataApi.getMaritalStatuses(),
        referenceDataApi.getOccupations(),
        referenceDataApi.getIncomeSources(),
        referenceDataApi.getBanks(),
        referenceDataApi.getReferencePersonRelationships(),
        referenceDataApi.getAssetTypes(),
        referenceDataApi.getValuationDeductionFactors(),
      ]);

      if (genders.status === "fulfilled") {
        setGenderOptions(mapReferenceOptions(genders.value));
      }
      if (maritalStatuses.status === "fulfilled") {
        setMaritalStatusOptions(mapReferenceOptions(maritalStatuses.value));
      }
      if (occupations.status === "fulfilled") {
        setOccupationOptions(mapReferenceOptions(occupations.value));
      }
      if (incomeSources.status === "fulfilled") {
        setIncomeSourceOptions(mapReferenceOptions(incomeSources.value));
      }
      if (banks.status === "fulfilled") {
        setBankOptions(mapReferenceOptions(banks.value));
      }
      if (relationships.status === "fulfilled") {
        setRelationshipOptions(mapReferenceOptions(relationships.value));
      }
      if (assetTypes.status === "fulfilled") {
        setAssetTypeOptions(mapReferenceOptions(assetTypes.value));
      }
      if (deductions.status === "fulfilled") {
        setDeductionOptions(mapDeductionItems(deductions.value));
      }
    };

    void loadReferenceData();
  }, []);

  useEffect(() => {
    const loadVehicleBrands = async () => {
      if (!watchedAssetType) {
        setVehicleBrandOptions([]);
        return;
      }

      const response = await referenceDataApi.getVehicleBrands({
        assetType: normalizeAssetType(String(watchedAssetType)),
      });

      setVehicleBrandOptions(mapReferenceOptions(response));
    };

    void loadVehicleBrands().catch(() => setVehicleBrandOptions([]));
  }, [watchedAssetType]);

  useEffect(() => {
    const loadVehicleModels = async () => {
      if (!watchedBrand) {
        setVehicleModelOptions([]);
        return;
      }

      const response = await referenceDataApi.getVehicleModels({
        brandCode: String(watchedBrand),
      });

      setVehicleModelOptions(mapReferenceOptions(response));
    };

    void loadVehicleModels().catch(() => setVehicleModelOptions([]));
  }, [watchedBrand]);

  useEffect(() => {
    const loadVehicleVersions = async () => {
      if (!watchedModel) {
        setVehicleVersionOptions([]);
        return;
      }

      const response = await referenceDataApi.getVehicleVersions({
        modelCode: String(watchedModel),
      });

      setVehicleVersionOptions(mapReferenceOptions(response));
    };

    void loadVehicleVersions().catch(() => setVehicleVersionOptions([]));
  }, [watchedModel]);

  useEffect(() => {
    const loadManufactureYears = async () => {
      if (!watchedModel || !watchedVersion) {
        setManufactureYearOptions([]);
        return;
      }

      const response = await referenceDataApi.getManufactureYears({
        modelCode: String(watchedModel),
        versionCode: String(watchedVersion),
      });

      setManufactureYearOptions(mapReferenceOptions(response));
    };

    void loadManufactureYears().catch(() => setManufactureYearOptions([]));
  }, [watchedModel, watchedVersion]);

  useEffect(() => {
    const loadVehicleColors = async () => {
      if (!watchedModel || !watchedVersion || !watchedManufactureYear) {
        setVehicleColorOptions([]);
        return;
      }

      const response = await referenceDataApi.getVehicleColors({
        modelCode: String(watchedModel),
        versionCode: String(watchedVersion),
        manufactureYear: Number(watchedManufactureYear),
      });

      setVehicleColorOptions(mapReferenceOptions(response));
    };

    void loadVehicleColors().catch(() => setVehicleColorOptions([]));
  }, [watchedModel, watchedVersion, watchedManufactureYear]);

  useEffect(() => {
    const resolveVehicleVariant = async () => {
      if (
        !watchedModel ||
        !watchedVersion ||
        !watchedManufactureYear ||
        !watchedVehicleColor
      ) {
        form.setValue("vehicleVariant", "", {
          shouldDirty: false,
          shouldValidate: false,
        });
        return;
      }

      const response = await referenceDataApi.getVehicleVariant({
        modelCode: String(watchedModel),
        versionCode: String(watchedVersion),
        manufactureYear: Number(watchedManufactureYear),
        colorCode: String(watchedVehicleColor),
      });
      const variant = mapReferenceOptions(response)[0];

      form.setValue("vehicleVariant", variant?.value || "", {
        shouldDirty: false,
        shouldValidate: false,
      });
    };

    void resolveVehicleVariant().catch(() => {
      form.setValue("vehicleVariant", "", {
        shouldDirty: false,
        shouldValidate: false,
      });
    });
  }, [
    form,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedVehicleColor,
  ]);

  const selectedDeductionItems = useMemo(() => {
    const selectedIds = watchedSelectedDeductionIds || [];

    return deductionOptions
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => ({
        type: item.id,
        rate: item.percent,
        label: item.label,
      }));
  }, [deductionOptions, watchedSelectedDeductionIds]);

  useEffect(() => {
    const runRecommendation = async () => {
      const loanPurpose = step2PreliminaryInfo.loanPurpose;
    const requestedLoanAmount = parseMoneyInput(
      step2PreliminaryInfo.desiredLoanAmount,
    ) ?? 0;
      const requestedTenor = Number(
        step2PreliminaryInfo.term || step2PreliminaryInfo.selectedTerm || 0,
      );

      if (
        !loanPurpose ||
        !watchedAssetType ||
        !watchedBrand ||
        !watchedModel ||
        !watchedVehicleVariant ||
        !watchedManufactureYear ||
        requestedLoanAmount <= 0 ||
        requestedTenor <= 0
      ) {
        setRecommendedProducts([]);
        setRecommendationError("");
        recommendationSignatureRef.current = "";
        return;
      }

      const assetSnapshot = {
        assetType: normalizeAssetType(String(watchedAssetType)),
        brand: String(watchedBrand),
        model: String(watchedModel),
        vehicleVariant: String(watchedVehicleVariant),
        manufactureYear: Number(watchedManufactureYear),
        vehicleColor: String(watchedVehicleColor || ""),
      };
      const valuationPayload = {
        assetSnapshot,
        deductionItems: selectedDeductionItems.map((item) => ({
          type: item.type,
          rate: item.rate,
        })),
      };
      const signature = JSON.stringify({
        valuationPayload,
        loanPurpose,
        requestedLoanAmount,
        requestedTenor,
        scoreGrade: creditScoring?.scoreGrade || "",
      });

      if (signature === recommendationSignatureRef.current) return;

      recommendationSignatureRef.current = signature;
      setIsRecommendationLoading(true);
      setRecommendationError("");

      try {
        const valuationResponse = await assetValuationApi.preview(valuationPayload);
        const valuationData = valuationResponse.data || valuationResponse;
        const adjustedAssetValue =
          getNumberFromUnknownObject(valuationData, [
            "finalValue",
            "valueAfterDeduction",
          ]) ||
          getNumberFromUnknownObject(valuationData, ["marketValue"]);

        if (adjustedAssetValue <= 0) {
          throw new Error("API valuation chưa trả giá trị tài sản hợp lệ.");
        }

        const recommendationResponse =
          await loanProductRecommendationApi.recommend({
            selectedLoanPurpose: loanPurpose,
            selectedAssetType: normalizeAssetType(String(watchedAssetType)),
            selectedTenor: requestedTenor,
            requestedLoanAmount,
            adjustedAssetValue,
            scoreGrade:
              creditScoring?.scoreGrade ||
              getStringFromUnknownObject(storedLoanRecommendation, [
                "scoreGrade",
              ]) ||
              getStringFromUnknownObject(step2PreliminaryInfo, [
                "scoreGrade",
                "creditScoreGrade",
              ]) ||
              getStringFromUnknownObject(step1Identity, [
                "scoreGrade",
                "creditScoreGrade",
              ]),
          });
        const products = recommendationResponse.data?.products || [];
        const nextRecommendedCode =
          recommendationResponse.data?.recommendedProductCode ||
          products.find((item) => item.recommended)?.productCode ||
          products[0]?.productCode ||
          "";
        const persistedSelectedCode =
          selectedProductCode ||
          form.getValues("selectedLoanProductCode") ||
          step2PreliminaryInfo.selectedProductCode ||
          getStringFromUnknownObject(selectedLoanProductData, ["productCode"]);
        const nextSelectedProductCode =
          persistedSelectedCode &&
          products.some((item) => item.productCode === persistedSelectedCode)
            ? persistedSelectedCode
            : nextRecommendedCode;

        setRecommendedProducts(products);
        setRecommendedProductCode(nextRecommendedCode);
        setSelectedProductCode(nextSelectedProductCode);
        setLoanRecommendation(
          recommendationResponse.data
            ? {
                ...recommendationResponse.data,
                valuation: valuationData,
              }
            : null,
        );
      } catch (error) {
        console.error("Step 3 recommendation error:", error);
        setRecommendedProducts([]);
        setRecommendationError(
          "Không thể lấy đề xuất gói vay. Vui lòng kiểm tra thông tin tài sản và nhu cầu vay.",
        );
        recommendationSignatureRef.current = "";
      } finally {
        setIsRecommendationLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void runRecommendation();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [
    selectedDeductionItems,
    setLoanRecommendation,
    step1Identity,
    step2PreliminaryInfo.desiredLoanAmount,
    step2PreliminaryInfo.loanPurpose,
    step2PreliminaryInfo.selectedTerm,
    step2PreliminaryInfo.term,
    storedLoanRecommendation,
    watchedAssetType,
    watchedBrand,
    watchedManufactureYear,
    watchedModel,
    watchedVersion,
    watchedVehicleColor,
    watchedVehicleVariant,
    creditScoring?.scoreGrade,
    selectedProductCode,
    selectedLoanProductData,
    form,
  ]);

  const buildStep3Data = (
    values: CustomerAssetDetailFormValues,
  ): CustomerAssetDetailState => {
    const completeReferences = getCompleteReferencePersons(values.references);

    return {
      ...initialCustomerAssetDetailData,
      fullName: values.fullName,
      identityNumber: values.identityNumber,
      phoneNumber: values.phoneNumber,
      dateOfBirth: values.dateOfBirth,
      gender: normalizeGender(values.gender),
      email: values.email || "",
      maritalStatus: values.maritalStatus,
      dependentCount: values.dependentCount || "",
      occupationCode: values.occupationCode,
      workplaceName: values.workplaceName || "",
      incomeSourceCode: values.incomeSourceCode,
      monthlyIncomeAmount: getDigitsOnly(values.monthlyIncomeAmount),
      disbursementBankCode: values.disbursementBankCode,
      disbursementAccountNumber: values.disbursementAccountNumber,
      disbursementAccountName: values.disbursementAccountName,
      permanentAddress: values.permanentAddress,
      currentAddress: values.currentAddress,
      references: completeReferences,
      assetData: {
        assetType: values.assetType,
        licensePlate: values.licensePlate,
        brand: values.brand,
        model: values.model,
        version: values.version,
        vehicleVariant: values.vehicleVariant || "",
        manufactureYear: values.manufactureYear,
        vehicleColor: values.vehicleColor,
        selectedDeductionIds: values.selectedDeductionIds || [],
        selectedDeductionItems,
        frameNumber: values.frameNumber,
        engineNumber: values.engineNumber,
        vehicleOwnerName: values.vehicleOwnerName,
        registrationNumber: values.registrationNumber || "",
        registrationIssueDate: normalizeRegistrationDateForApi(
          values.registrationIssueDate,
        ),
      },
      selectedLoanProductCode: selectedProductCode || "",
    };
  };

  const buildStep3DraftPayload = (
    nextStep3Data: CustomerAssetDetailState,
    selectedProduct?: Record<string, unknown> | null,
  ) => {
    return {
      customerDetail: {
        fullName: nextStep3Data.fullName,
        identityNumber: nextStep3Data.identityNumber,
        phoneNumber: nextStep3Data.phoneNumber,
        dateOfBirth:
          parseDisplayDateToApi(nextStep3Data.dateOfBirth) ||
          nextStep3Data.dateOfBirth,
        gender: nextStep3Data.gender,
        email: nextStep3Data.email,
        maritalStatus: nextStep3Data.maritalStatus,
        dependentCount: nextStep3Data.dependentCount,
        occupationCode: nextStep3Data.occupationCode,
        workplaceName: nextStep3Data.workplaceName,
        incomeSourceCode: nextStep3Data.incomeSourceCode,
        monthlyIncomeAmount: Number(nextStep3Data.monthlyIncomeAmount || 0),
        disbursementBankCode: nextStep3Data.disbursementBankCode,
        disbursementAccountNumber: nextStep3Data.disbursementAccountNumber,
        disbursementAccountName: nextStep3Data.disbursementAccountName,
        permanentAddress: nextStep3Data.permanentAddress,
        currentAddress: nextStep3Data.currentAddress,
      },
      referencePersons: nextStep3Data.references,
      assetDetail: nextStep3Data.assetData,
      preliminaryInfo: step2PreliminaryInfo,
      valuation: storedLoanRecommendation?.valuation || null,
      loanProductRecommendation: storedLoanRecommendation || null,
      selectedLoanProduct: selectedProduct || selectedLoanProductData,
      selectedLoanProductCode: selectedProductCode || "",
    };
  };

  const currentStep3FormValues = useMemo<CustomerAssetDetailFormValues>(() => {
    return {
      ...form.getValues(),
      ...watchedFormValues,
    };
  }, [form, watchedFormValues]);

  const currentStep3Data = useMemo(() => {
    return buildStep3Data(currentStep3FormValues);
  }, [
    currentStep3FormValues,
    selectedDeductionItems,
    selectedProductCode,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerAssetDetailData(currentStep3Data);
      setAssetData(currentStep3Data.assetData);
      setReferences(currentStep3Data.references);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentStep3Data,
    setAssetData,
    setCustomerAssetDetailData,
    setReferences,
  ]);

  const step3SelectedProduct = useMemo(() => {
    return (
      recommendedProducts.find(
        (product) => product.productCode === selectedProductCode,
      ) ||
      selectedLoanProductData ||
      null
    );
  }, [recommendedProducts, selectedLoanProductData, selectedProductCode]);

  const currentDraftCode =
    draftCode ||
    String(step2PreliminaryInfo.draftCode || "") ||
    String(step1Identity.draftCode || "");

  const step3Autosave = useDraftStepAutosave({
    draftCode: currentDraftCode,
    stepCode: LOAN_APPLICATION_DRAFT_STEPS.customerAssetLoanProposal,
    data: buildStep3DraftPayload(currentStep3Data, step3SelectedProduct),
    enabled: Boolean(currentDraftCode),
    debounceMs: 1000,
  });

  const handleSubmit = async (values: CustomerAssetDetailFormValues) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (!values.vehicleVariant) {
        throw new Error("Chua resolve duoc bien the xe tu thong tin da chon.");
      }

      const completeReferences = getCompleteReferencePersons(values.references);

      if (completeReferences.length < 3) {
        throw new Error("Can toi thieu 3 nguoi tham chieu hop le.");
      }

      const nextStep3Data = buildStep3Data(values);
      const selectedProduct = recommendedProducts.find(
        (product) => product.productCode === selectedProductCode,
      );
      const currentDraftCode =
        draftCode ||
        String(step2PreliminaryInfo.draftCode || "") ||
        String(step1Identity.draftCode || "");

      if (!currentDraftCode) {
        throw new Error(
          "Thieu draftCode. Vui long hoan tat man dinh danh truoc.",
        );
      }

      const response =
        await loanApplicationDraftApi.completeCustomerAssetLoanProposal(
          currentDraftCode,
          {
            payload: buildStep3DraftPayload(nextStep3Data, selectedProduct),
          },
        );

      if (!response.success || !response.data?.draftCode) {
        throw new Error(
          response.message || "Khong the hoan tat thong tin buoc 3 len backend.",
        );
      }

      setDraftInfo({
        draftCode: response.data.draftCode,
        currentStepCode: response.data.currentStepCode || "",
      });

      setCustomerAssetDetailData(nextStep3Data);
      setAssetData(nextStep3Data.assetData);
      setReferences(nextStep3Data.references);

      setSelectedLoanProduct(selectedProduct || selectedLoanProductData || null);
      setCurrentStep(4);
      toast.success("Đã lưu thông tin bước 3 vào phiên làm việc.");

      navigate({
        to: "/loan/upload-documents",
      });
    } catch (error) {
      console.error("Save step 3 state error:", error);
      const message = getApiErrorMessage(error);

      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = () => {
    toast.error("Vui lòng kiểm tra trường bắt buộc hoặc dữ liệu sai định dạng.");
  };

  const handleBack = () => {
    setCurrentStep(2);
    navigate({
      to: "/loan/preliminary-info",
    });
  };

  const handleAddReference = () => {
    if (fields.length >= 4) {
      toast.error("Số người tham chiếu tối đa là 4.");
      return;
    }

    append({
      fullName: "",
      relationshipType: "",
      phoneNumber: "",
      address: "",
      note: "",
    });
  };

  const validReferenceCount = getCompleteReferencePersons(
    form.watch("references"),
  ).length;

  const selectedDeductionLabels = selectedDeductionItems.map((item) => item.label);
  const waitingRecommendationMessage =
    "Chưa đủ dữ liệu để lấy đề xuất gói vay từ backend.";
  const requestedLoanAmount = parseMoneyInput(
    step2PreliminaryInfo.desiredLoanAmount,
  ) ?? 0;
  const loanTermMonths = Number(
    step2PreliminaryInfo.term || step2PreliminaryInfo.selectedTerm || 0,
  );
  const customerRiskScoring = mapCustomerRiskScoring(
    finalOfferPreview?.scoring ||
      (creditScoring
        ? {
            overallScore: creditScoring.totalScore,
            scoreGrade: creditScoring.scoreGrade,
            riskLevel: creditScoring.scoreGradeLabel,
            description: creditScoring.ruleSetCode,
          }
        : null) ||
      storedLoanRecommendation?.scoring,
  );

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <main className="min-h-screen">
        <section className="px-8 py-6">
          <CustomerIdentifyBreadcrumb currentStep={CURRENT_STEP} />

          <div className="overflow-x-auto pb-2">
            <LoanOnboardingStepper currentStep={CURRENT_STEP} />
          </div>
          {currentDraftCode && (
            <p className="mb-3 text-xs font-medium text-[#15803d]">
              {step3Autosave.status === "saving" && "Dang luu nhap..."}
              {step3Autosave.status === "saved" && "Da luu nhap"}
              {step3Autosave.status === "error" && "Luu nhap that bai"}
            </p>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}>
              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                  <SectionCard
                    title="Thông tin chi tiết khách hàng"
                    icon={<User size={24} color="#009b3a" variant="Outline" />}
                    iconClassName="bg-[#e9f8ee]"
                  >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <CustomerAssetTextField
                        form={form}
                        name="fullName"
                        label="Họ và tên"
                        required
                        placeholder="Nhập họ và tên"
                        autoFilled={hasAutoFilledCustomerInfo}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="identityNumber"
                        label="Số CCCD"
                        placeholder="Nhập số CCCD"
                        onlyNumber
                        maxLength={12}
                        autoFilled={hasAutoFilledCustomerInfo}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="phoneNumber"
                        label="Số điện thoại"
                        placeholder="Nhập số điện thoại"
                        onlyNumber
                        maxLength={11}
                        autoFilled={hasAutoFilledCustomerInfo}
                      />
                      <CustomerAssetDateField
                        form={form}
                        name="dateOfBirth"
                        label="Ngày sinh"
                        placeholder="Chọn ngày sinh"
                        autoFilled={hasAutoFilledCustomerInfo}
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="gender"
                        label="Giới tính"
                        required
                        placeholder="Chọn giới tính"
                        options={genderOptions}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="email"
                        label="Email"
                        placeholder="Nhập email"
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="maritalStatus"
                        label="Tình trạng hôn nhân"
                        required
                        placeholder="Chọn tình trạng"
                        options={maritalStatusOptions}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="dependentCount"
                        label="Số người phụ thuộc"
                        placeholder="Nhập số người phụ thuộc"
                        onlyNumber
                        onAfterChange={(value) => {
                          if (Number(value) > 4) {
                            form.setValue("dependentCount", "4", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            toast.error("Số người phụ thuộc tối đa là 4");
                          }
                        }}
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="occupationCode"
                        label="Nghề nghiệp"
                        required
                        placeholder="Chọn nghề nghiệp"
                        options={occupationOptions}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="workplaceName"
                        label="Đơn vị công tác"
                        placeholder="Nhập đơn vị công tác"
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="incomeSourceCode"
                        label="Nguồn thu nhập"
                        required
                        placeholder="Chọn nguồn thu nhập"
                        options={incomeSourceOptions}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="monthlyIncomeAmount"
                        label="Thu nhập hàng tháng"
                        required
                        placeholder="VD: 12.000.000"
                        inputMode="numeric"
                        formatCurrencyVnd
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="disbursementBankCode"
                        label="Ngân hàng giải ngân"
                        required
                        placeholder="Chọn ngân hàng"
                        options={bankOptions}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="disbursementAccountNumber"
                        label="Số tài khoản"
                        required
                        placeholder="Nhập số tài khoản"
                        onlyNumber
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="disbursementAccountName"
                        label="Chủ tài khoản"
                        required
                        placeholder="Nhập chủ tài khoản"
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="permanentAddress"
                        label="Địa chỉ thường trú"
                        required
                        placeholder="Nhập địa chỉ thường trú"
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="currentAddress"
                        label="Địa chỉ hiện tại"
                        required
                        placeholder="Nhập địa chỉ hiện tại"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Người tham chiếu"
                    icon={<User size={24} color="#009b3a" variant="Outline" />}
                    iconClassName="bg-[#e9f8ee]"
                    rightContent={
                      <span className="text-sm font-medium text-[#64748b]">
                        {validReferenceCount}/3 người tham chiếu hợp lệ
                      </span>
                    }
                  >
                    <div className="space-y-5">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] p-5 transition-all duration-200 hover:border-[#b7e4c7] hover:shadow-sm"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-[#111827]">
                              Người tham chiếu {index + 1}
                            </h3>
                            {fields.length > 3 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
                                Xóa
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <CustomerAssetTextField
                              form={form}
                              name={`references.${index}.fullName` as const}
                              label="Họ và tên"
                              required
                              placeholder="Nhập họ và tên"
                            />
                            <CustomerAssetSelectField
                              form={form}
                              name={
                                `references.${index}.relationshipType` as const
                              }
                              label="Mối quan hệ"
                              required
                              placeholder="Chọn mối quan hệ"
                              options={relationshipOptions}
                            />
                            <CustomerAssetTextField
                              form={form}
                              name={`references.${index}.phoneNumber` as const}
                              label="Số điện thoại"
                              required
                              placeholder="Nhập số điện thoại"
                              onlyNumber
                              maxLength={11}
                            />
                            <CustomerAssetTextField
                              form={form}
                              name={`references.${index}.address` as const}
                              label="Địa chỉ"
                              placeholder="Nhập địa chỉ"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddReference}
                        className="h-11 rounded-xl border-[#009b3a] px-5 font-bold text-[#009b3a] transition-colors hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                      >
                        + Thêm người tham chiếu
                      </Button>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Thông tin chi tiết tài sản"
                    icon={<Car size={24} color="#8a6d00" variant="Outline" />}
                    iconClassName="bg-[#fff6d8]"
                  >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <CustomerAssetSelectField
                        form={form}
                        name="assetType"
                        label="Loại tài sản"
                        placeholder="Chọn loại tài sản"
                        options={assetTypeOptions}
                        onAfterChange={() => {
                          form.setValue("brand", "");
                          form.setValue("model", "");
                          form.setValue("version", "");
                          form.setValue("manufactureYear", "");
                          form.setValue("vehicleColor", "");
                        }}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="licensePlate"
                        label="Biển số xe"
                        required
                        placeholder="Nhập biển số xe"
                        uppercase
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="brand"
                        label="Hãng xe"
                        placeholder="Chọn hãng xe"
                        options={vehicleBrandOptions}
                        disabled={!watchedAssetType}
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="model"
                        label="Dòng xe"
                        placeholder="Chọn dòng xe"
                        options={vehicleModelOptions}
                        disabled={!watchedBrand}
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="manufactureYear"
                        label="Năm sản xuất"
                        placeholder="Chọn năm sản xuất"
                        options={manufactureYearOptions}
                        disabled={!watchedVersion}
                      />
                      <CustomerAssetSelectField
                        form={form}
                        name="vehicleColor"
                        label="Màu xe"
                        placeholder="Chọn màu xe"
                        options={vehicleColorOptions}
                        disabled={!watchedManufactureYear}
                      />
                    </div>

                    <div className="mt-6 rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] p-4">
                      <p className="text-sm font-bold text-[#111827]">
                        Yếu tố giảm trừ đã chọn
                      </p>
                      {selectedDeductionLabels.length === 0 ? (
                        <p className="mt-2 text-sm text-[#64748b]">
                          Chưa có yếu tố giảm trừ nào được chọn ở Bước 2
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedDeductionLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-[#e9f8ee] px-3 py-1 text-sm font-medium text-[#009b3a]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Thông tin pháp lý xe — Thông tin chi tiết"
                    icon={<Car size={24} color="#009b3a" variant="Outline" />}
                    iconClassName="bg-[#e9f8ee]"
                  >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                      <CustomerAssetSelectField
                        form={form}
                        name="version"
                        label="Phiên bản"
                        placeholder="Chọn phiên bản"
                        options={vehicleVersionOptions}
                        disabled={!watchedModel}
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="frameNumber"
                        label="Số khung"
                        required
                        placeholder="Nhập số khung"
                        uppercase
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="engineNumber"
                        label="Số máy"
                        required
                        placeholder="Nhập số máy"
                        uppercase
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="vehicleOwnerName"
                        label="Tên chủ sở hữu (theo cà vẹt)"
                        required
                        placeholder="Nhập tên chủ sở hữu"
                      />
                      <CustomerAssetTextField
                        form={form}
                        name="registrationNumber"
                        label="Số đăng ký xe"
                        placeholder="Nhập số đăng ký xe"
                        uppercase
                      />
                      <CustomerAssetDateField
                        form={form}
                        name="registrationIssueDate"
                        label="Ngày đăng ký xe"
                        placeholder="Chọn ngày đăng ký xe"
                      />
                    </div>
                  </SectionCard>

                  {submitError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {submitError}
                    </div>
                  )}

                  <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between rounded-t-2xl border border-[#dbe5dd] bg-white px-7 py-4 shadow-sm">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="h-11 rounded-xl bg-white px-8 font-bold shadow-sm"
                    >
                      Quay lại
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 rounded-xl bg-[#009b3a] px-8 font-bold text-white hover:bg-[#008232]"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Tiếp tục"}
                    </Button>
                  </div>
                </div>

                <LoanRecommendationPanel
                  open={recommendationOpen}
                  onToggle={() => setRecommendationOpen((prev) => !prev)}
                  isLoading={isRecommendationLoading}
                  error={recommendationError}
                  products={recommendedProducts}
                  recommendedProductCode={recommendedProductCode}
                  selectedProductCode={selectedProductCode}
                  requestedLoanAmount={requestedLoanAmount}
                  loanTermMonths={loanTermMonths}
                  scoring={customerRiskScoring}
                  waitingMessage={
                    creditScoringError || waitingRecommendationMessage
                  }
                />
              </div>
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
}

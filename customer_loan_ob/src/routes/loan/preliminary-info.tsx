import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Calculator, Car, DocumentText, TickCircle } from "iconsax-react";

import { Form } from "@/components/ui/form";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";

import {
  getStep1Identity,
  getStep2PreliminaryInfo,
  saveStep2PreliminaryInfo,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";

import { preliminaryInfoApi } from "@/features/preliminary-info/api/preliminary-info.api";
import { assetValuationApi } from "@/features/preliminary-info/api/asset-valuation.api";
import { referenceDataApi } from "@/features/preliminary-info/api/reference-data.api";
import { loanProductRecommendationApi } from "@/features/preliminary-info/api/loan-product-recommendation.api";

import { AppraisalSummary } from "@/features/preliminary-info/components/AppraisalSummary";
import { BottomActions } from "@/features/preliminary-info/components/BottomActions";
import { DateOfBirthField } from "@/features/preliminary-info/components/DateOfBirthField";
import { DeductionList } from "@/features/preliminary-info/components/DeductionList";
import { LoanPackageSelector } from "@/features/preliminary-info/components/LoanPackageSelector";
import { SectionCard } from "@/features/preliminary-info/components/SectionCard";
import { SelectField } from "@/features/preliminary-info/components/SelectField";
import { TextInputField } from "@/features/preliminary-info/components/TextInputField";

import {
  preliminaryInfoSchema,
  type PreliminaryInfoFormValues,
} from "@/features/preliminary-info/schemas/preliminary-info.schema";

import type {
  DeductionItem,
  LoanPackage,
  LoanPackageId,
  PreliminaryInfoPayload,
} from "@/features/preliminary-info/types/preliminary-info.type";

import type {
  AssetTypeApiValue,
  AssetValuationMarketPriceResponse,
  AssetValuationPayload,
  AssetValuationPreviewData,
  AssetValuationResponse,
} from "@/features/preliminary-info/types/asset-valuation.type";

import type {
  ReferenceDataItem,
  ReferenceOption,
} from "@/features/preliminary-info/types/reference-data.type";

import type {
  LoanProductRecommendationProduct,
  LoanProductRecommendationResponse,
} from "@/features/preliminary-info/types/loan-product-recommendation.type";

export const Route = createFileRoute("/loan/preliminary-info")({
  component: PreliminaryInfoScreen,
});

const CURRENT_STEP = 2;

const loanPackages: LoanPackage[] = [
  {
    id: "standard",
    name: "Gói Tiêu chuẩn",
    interestRate: 2.5,
    ltv: 70,
    maxLoanAmount: 35_000_000,
    terms: [12, 36, 48, 72],
  },
  {
    id: "promotion",
    name: "Gói Ưu đãi",
    tag: "Khuyến nghị",
    interestRate: 2,
    ltv: 75,
    maxLoanAmount: 37_500_000,
    terms: [12, 36, 48, 72],
  },
  {
    id: "vip",
    name: "Gói VIP",
    tag: "KH Cũ",
    interestRate: 1.8,
    ltv: 80,
    maxLoanAmount: 40_000_000,
    terms: [12, 36, 48, 72],
    disabled: true,
  },
];

function getDigitsOnly(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function formatCurrencyVndForDefaultValue(value?: string) {
  const digitsOnly = getDigitsOnly(value);

  if (!digitsOnly) return "";

  return `${digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} Đ`;
}

function getStringFromUnknownObject(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return "";

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getApplicationCodeFromStorage(step1: unknown, step2: unknown) {
  const fromStepData =
    getStringFromUnknownObject(step2, [
      "applicationCode",
      "loanApplicationCode",
      "loanApplicationId",
    ]) ||
    getStringFromUnknownObject(step1, [
      "applicationCode",
      "loanApplicationCode",
      "loanApplicationId",
    ]);

  if (fromStepData) return fromStepData;

  const storageKeys = [
    "applicationCode",
    "loanApplicationCode",
    "currentApplicationCode",
  ];

  for (const key of storageKeys) {
    const value = sessionStorage.getItem(key);

    if (value) return value;
  }

  return "";
}

function getScoreGradeFromStorage(step1: unknown, step2: unknown) {
  const fromStepData =
    getStringFromUnknownObject(step2, ["scoreGrade", "creditScoreGrade"]) ||
    getStringFromUnknownObject(step1, ["scoreGrade", "creditScoreGrade"]);

  if (fromStepData) return fromStepData;

  return sessionStorage.getItem("scoreGrade") || "A";
}

function mapOcrSexToGender(sex?: string) {
  if (!sex) return "";

  const normalizedSex = sex.trim().toLowerCase();

  if (
    normalizedSex === "nam" ||
    normalizedSex === "male" ||
    normalizedSex === "m"
  ) {
    return "MALE";
  }

  if (
    normalizedSex === "nữ" ||
    normalizedSex === "nu" ||
    normalizedSex === "female" ||
    normalizedSex === "f"
  ) {
    return "FEMALE";
  }

  return "OTHER";
}

function normalizeGender(value?: string) {
  if (!value) return "";

  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue === "MALE" || normalizedValue === "NAM") {
    return "MALE";
  }

  if (
    normalizedValue === "FEMALE" ||
    normalizedValue === "NỮ" ||
    normalizedValue === "NU"
  ) {
    return "FEMALE";
  }

  if (normalizedValue === "OTHER" || normalizedValue === "KHÁC") {
    return "OTHER";
  }

  return value;
}

function normalizeAssetType(value?: string) {
  if (!value) return "";

  const normalizedValue = value.trim().toUpperCase();

  if (
    normalizedValue === "CAR" ||
    normalizedValue === "OTO" ||
    normalizedValue === "Ô TÔ"
  ) {
    return "CAR";
  }

  if (
    normalizedValue === "MOTORBIKE" ||
    normalizedValue === "MOTORCYCLE" ||
    normalizedValue === "XE_MAY" ||
    normalizedValue === "XE MÁY"
  ) {
    return "MOTORBIKE";
  }

  return value;
}

function mapAssetTypeToApiValue(assetType?: string): AssetTypeApiValue {
  const normalizedAssetType = normalizeAssetType(assetType);

  if (normalizedAssetType === "CAR") {
    return "CAR";
  }

  return "MOTORBIKE";
}

function getReferenceItems(response: unknown): ReferenceDataItem[] {
  const raw = response as {
    data?:
      | ReferenceDataItem[]
      | ReferenceDataItem
      | {
          data?: ReferenceDataItem[];
          content?: ReferenceDataItem[];
          items?: ReferenceDataItem[];
          records?: ReferenceDataItem[];
          list?: ReferenceDataItem[];
        };
    content?: ReferenceDataItem[];
    items?: ReferenceDataItem[];
    records?: ReferenceDataItem[];
    list?: ReferenceDataItem[];
  };

  if (Array.isArray(response)) {
    return response as ReferenceDataItem[];
  }

  if (Array.isArray(raw.data)) {
    return raw.data;
  }

  if (
    raw.data &&
    typeof raw.data === "object" &&
    "data" in raw.data &&
    Array.isArray(raw.data.data)
  ) {
    return raw.data.data;
  }

  if (
    raw.data &&
    typeof raw.data === "object" &&
    "content" in raw.data &&
    Array.isArray(raw.data.content)
  ) {
    return raw.data.content;
  }

  if (
    raw.data &&
    typeof raw.data === "object" &&
    "items" in raw.data &&
    Array.isArray(raw.data.items)
  ) {
    return raw.data.items;
  }

  if (
    raw.data &&
    typeof raw.data === "object" &&
    "records" in raw.data &&
    Array.isArray(raw.data.records)
  ) {
    return raw.data.records;
  }

  if (
    raw.data &&
    typeof raw.data === "object" &&
    "list" in raw.data &&
    Array.isArray(raw.data.list)
  ) {
    return raw.data.list;
  }

  if (Array.isArray(raw.content)) {
    return raw.content;
  }

  if (Array.isArray(raw.items)) {
    return raw.items;
  }

  if (Array.isArray(raw.records)) {
    return raw.records;
  }

  if (Array.isArray(raw.list)) {
    return raw.list;
  }

  if (raw.data && typeof raw.data === "object") {
    return [raw.data as ReferenceDataItem];
  }

  return [];
}

function getReferenceItemValue(item: ReferenceDataItem): string {
  const value =
    item.code ??
    item.value ??
    item.occupationCode ??
    item.occupation ??
    item.jobCode ??
    item.job ??
    item.modelCode ??
    item.model ??
    item.brandCode ??
    item.brand ??
    item.versionCode ??
    item.vehicleVersionCode ??
    item.vehicleVersion ??
    item.vehicleVariantCode ??
    item.vehicleVariant ??
    item.colorCode ??
    item.vehicleColorCode ??
    item.vehicleColor ??
    item.color ??
    item.manufactureYear ??
    item.year ??
    item.id ??
    "";

  return String(value);
}

function getReferenceItemLabel(item: ReferenceDataItem): string {
  const label =
    item.name ??
    item.label ??
    item.displayName ??
    item.occupationName ??
    item.occupation ??
    item.jobName ??
    item.job ??
    item.modelName ??
    item.model ??
    item.brandName ??
    item.brand ??
    item.versionName ??
    item.vehicleVersionName ??
    item.vehicleVersion ??
    item.vehicleVariantName ??
    item.vehicleVariant ??
    item.colorName ??
    item.vehicleColorName ??
    item.vehicleColor ??
    item.color ??
    item.description ??
    item.manufactureYear ??
    item.year ??
    item.code ??
    item.value ??
    item.id ??
    "";

  return String(label);
}

function mapReferenceOptions(response: unknown): ReferenceOption[] {
  return getReferenceItems(response)
    .map((item) => ({
      label: getReferenceItemLabel(item),
      value: getReferenceItemValue(item),
    }))
    .filter((item) => item.label !== "" && item.value !== "");
}

function mapDeductionItems(response: unknown): DeductionItem[] {
  return getReferenceItems(response)
    .map((item) => ({
      id: String(item.type ?? item.code ?? item.value ?? item.id ?? ""),
      label: String(
        item.label ??
          item.name ??
          item.displayName ??
          item.description ??
          item.type ??
          item.code ??
          "",
      ),
      percent: Number(
        item.rate ??
          item.percent ??
          item.deductionRate ??
          item.deductionPercent ??
          0,
      ),
    }))
    .filter((item) => item.id && item.label);
}

function PreliminaryInfoScreen() {
  const navigate = useNavigate();

  const step1Identity = getStep1Identity();
  const step2Session = getStep2PreliminaryInfo();

  const step1StorageData = step1Identity as Record<string, unknown> | null;
  const step2StorageData = step2Session as Record<string, unknown> | null;

  const applicationCode = getApplicationCodeFromStorage(
    step1StorageData,
    step2StorageData,
  );

  const scoreGrade = getScoreGradeFromStorage(
    step1StorageData,
    step2StorageData,
  );

  const initialGender = normalizeGender(
    step2Session?.gender || mapOcrSexToGender(step1Identity?.sex),
  );

  const [selectedDeductionIds, setSelectedDeductionIds] = useState<string[]>(
    step2Session?.selectedDeductionIds || [],
  );

  const [selectedPackageId, setSelectedPackageId] = useState<LoanPackageId>(
    step2Session?.selectedPackageId || "promotion",
  );

  const [selectedTerm, setSelectedTerm] = useState(
    step2Session?.selectedTerm || step2Session?.term || "12",
  );

  const [loanRecommendationResult, setLoanRecommendationResult] =
    useState<LoanProductRecommendationResponse | null>(null);

  const [recommendedProducts, setRecommendedProducts] = useState<
    LoanProductRecommendationProduct[]
  >([]);

  const [selectedProductCode, setSelectedProductCode] = useState(
    getStringFromUnknownObject(step2StorageData, [
      "selectedProductCode",
      "recommendedProductCode",
    ]),
  );

  const [isLoanRecommendationLoading, setIsLoanRecommendationLoading] =
    useState(false);

  const [loanRecommendationError, setLoanRecommendationError] = useState("");

  const loanRecommendationTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const loanRecommendationSignatureRef = useRef("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isValuationLoading, setIsValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState("");

  const [marketPriceResult, setMarketPriceResult] =
    useState<AssetValuationMarketPriceResponse | null>(null);

  const [valuationResult, setValuationResult] =
    useState<AssetValuationResponse | null>(null);

  const [genderOptions, setGenderOptions] = useState<ReferenceOption[]>([]);
  const [occupationOptions, setOccupationOptions] =
    useState<ReferenceOption[]>([]);
  const [loanPurposeOptions, setLoanPurposeOptions] = useState<
    ReferenceOption[]
  >([]);
  const [assetTypeOptions, setAssetTypeOptions] =
    useState<ReferenceOption[]>([]);
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

  const [deductionAmountsById, setDeductionAmountsById] = useState<
    Record<string, number>
  >({});

  const [resolvedVehicleVariant, setResolvedVehicleVariant] =
    useState<ReferenceOption | null>(null);

  const valuationRequestSignatureRef = useRef("");
  const valuationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<PreliminaryInfoFormValues>({
    resolver: zodResolver(preliminaryInfoSchema),
    defaultValues: {
      fullName: step2Session?.fullName || step1Identity?.fullName || "",
      identityNumber:
        step2Session?.identityNumber || step1Identity?.identityNumber || "",
      phoneNumber:
        step2Session?.phoneNumber || step1Identity?.phoneNumber || "",
      dateOfBirth:
        step2Session?.dateOfBirth || step1Identity?.dateOfBirth || "",

      gender: initialGender,
      job: step2Session?.job || "",
      monthlyIncome: formatCurrencyVndForDefaultValue(
        step2Session?.monthlyIncome,
      ),
      loanPurpose: step2Session?.loanPurpose || "",
      desiredLoanAmount: formatCurrencyVndForDefaultValue(
        step2Session?.desiredLoanAmount,
      ),
      term: step2Session?.term || "12",

      assetType: normalizeAssetType(step2Session?.assetType),
      brand: step2Session?.brand || "",
      model: step2Session?.model || "",
      version: step2Session?.version || "",
      manufactureYear: step2Session?.manufactureYear || "",
      color: step2Session?.color || "",
    },
  });

  const [
    watchedAssetType,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedColor,
    watchedLoanPurpose,
    watchedDesiredLoanAmount,
    watchedTerm,
  ] = useWatch({
    control: form.control,
    name: [
      "assetType",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "color",
      "loanPurpose",
      "desiredLoanAmount",
      "term",
    ],
  });

  useEffect(() => {
    let isMounted = true;

    const loadAssetTypes = async () => {
      try {
        const response = await referenceDataApi.getAssetTypes();
        const options = mapReferenceOptions(response);

        if (!isMounted) return;

        setAssetTypeOptions(options);
      } catch (error) {
        console.error("Load asset types error:", error);

        if (!isMounted) return;

        setAssetTypeOptions([]);
      }
    };

    const loadGenders = async () => {
      try {
        const response = await referenceDataApi.getGenders();
        const options = mapReferenceOptions(response);

        if (!isMounted) return;

        setGenderOptions(options);
      } catch (error) {
        console.error("Load genders error:", error);

        if (!isMounted) return;

        setGenderOptions([]);
      }
    };

    const loadOccupations = async () => {
      try {
        const response = await referenceDataApi.getOccupations();
        const options = mapReferenceOptions(response);

        console.log("Occupations response:", response);
        console.log("Occupations options:", options);

        if (!isMounted) return;

        setOccupationOptions(options);
      } catch (error) {
        console.error("Load occupations error:", error);

        if (!isMounted) return;

        setOccupationOptions([]);
      }
    };

    const loadLoanPurposes = async () => {
      try {
        const response = await referenceDataApi.getLoanPurposes();
        const options = mapReferenceOptions(response);

        if (!isMounted) return;

        setLoanPurposeOptions(options);
      } catch (error) {
        console.error("Load loan purposes error:", error);

        if (!isMounted) return;

        setLoanPurposeOptions([]);
      }
    };

    const loadDeductionFactors = async () => {
      try {
        const response = await referenceDataApi.getValuationDeductionFactors();
        const deductionItems = mapDeductionItems(response);

        if (!isMounted) return;

        setDeductionOptions(deductionItems);
      } catch (error) {
        console.error("Load deduction factors error:", error);

        if (!isMounted) return;

        setDeductionOptions([]);
      }
    };

    void Promise.allSettled([
      loadAssetTypes(),
      loadGenders(),
      loadOccupations(),
      loadLoanPurposes(),
      loadDeductionFactors(),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleBrands = async () => {
      if (!watchedAssetType) {
        setVehicleBrandOptions([]);
        return;
      }

      try {
        const response = await referenceDataApi.getVehicleBrands({
          assetType: mapAssetTypeToApiValue(watchedAssetType),
        });

        if (!isMounted) return;

        setVehicleBrandOptions(mapReferenceOptions(response));
      } catch (error) {
        console.error("Load vehicle brands error:", error);

        if (!isMounted) return;

        setVehicleBrandOptions([]);
      }
    };

    void loadVehicleBrands();

    return () => {
      isMounted = false;
    };
  }, [watchedAssetType]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleModels = async () => {
      if (!watchedBrand) {
        setVehicleModelOptions([]);
        return;
      }

      try {
        const response = await referenceDataApi.getVehicleModels({
          brandCode: String(watchedBrand),
        });

        if (!isMounted) return;

        setVehicleModelOptions(mapReferenceOptions(response));
      } catch (error) {
        console.error("Load vehicle models error:", error);

        if (!isMounted) return;

        setVehicleModelOptions([]);
      }
    };

    void loadVehicleModels();

    return () => {
      isMounted = false;
    };
  }, [watchedBrand]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleVersions = async () => {
      if (!watchedModel) {
        setVehicleVersionOptions([]);
        return;
      }

      try {
        const response = await referenceDataApi.getVehicleVersions({
          modelCode: String(watchedModel),
        });

        if (!isMounted) return;

        setVehicleVersionOptions(mapReferenceOptions(response));
      } catch (error) {
        console.error("Load vehicle versions error:", error);

        if (!isMounted) return;

        setVehicleVersionOptions([]);
      }
    };

    void loadVehicleVersions();

    return () => {
      isMounted = false;
    };
  }, [watchedModel]);

  useEffect(() => {
    let isMounted = true;

    const loadManufactureYears = async () => {
      if (!watchedModel || !watchedVersion) {
        setManufactureYearOptions([]);
        return;
      }

      try {
        const response = await referenceDataApi.getManufactureYears({
          modelCode: String(watchedModel),
          versionCode: String(watchedVersion),
        });

        if (!isMounted) return;

        setManufactureYearOptions(mapReferenceOptions(response));
      } catch (error) {
        console.error("Load manufacture years error:", error);

        if (!isMounted) return;

        setManufactureYearOptions([]);
      }
    };

    void loadManufactureYears();

    return () => {
      isMounted = false;
    };
  }, [watchedModel, watchedVersion]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleColors = async () => {
      if (!watchedModel || !watchedVersion || !watchedManufactureYear) {
        setVehicleColorOptions([]);
        return;
      }

      try {
        const response = await referenceDataApi.getVehicleColors({
          modelCode: String(watchedModel),
          versionCode: String(watchedVersion),
          manufactureYear: Number(watchedManufactureYear),
        });

        if (!isMounted) return;

        setVehicleColorOptions(mapReferenceOptions(response));
      } catch (error) {
        console.error("Load vehicle colors error:", error);

        if (!isMounted) return;

        setVehicleColorOptions([]);
      }
    };

    void loadVehicleColors();

    return () => {
      isMounted = false;
    };
  }, [watchedModel, watchedVersion, watchedManufactureYear]);

  useEffect(() => {
    let isMounted = true;

    const loadResolvedVehicleVariant = async () => {
      if (
        !watchedModel ||
        !watchedVersion ||
        !watchedManufactureYear ||
        !watchedColor
      ) {
        setResolvedVehicleVariant(null);
        return;
      }

      try {
        const response = await referenceDataApi.getVehicleVariant({
          modelCode: String(watchedModel),
          versionCode: String(watchedVersion),
          manufactureYear: Number(watchedManufactureYear),
          colorCode: String(watchedColor),
        });

        if (!isMounted) return;

        const options = mapReferenceOptions(response);

        setResolvedVehicleVariant(options[0] || null);
      } catch (error) {
        console.error("Load vehicle variant error:", error);

        if (!isMounted) return;

        setResolvedVehicleVariant(null);
      }
    };

    void loadResolvedVehicleVariant();

    return () => {
      isMounted = false;
    };
  }, [watchedModel, watchedVersion, watchedManufactureYear, watchedColor]);

  const marketValue =
    valuationResult?.data?.marketValue ??
    valuationResult?.marketValue ??
    marketPriceResult?.data?.marketValue ??
    0;

  const selectedPackage = useMemo(() => {
    return (
      loanPackages.find((item) => item.id === selectedPackageId) ||
      loanPackages[1]
    );
  }, [selectedPackageId]);

  const totalDeductionPercent = useMemo(() => {
    return deductionOptions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .reduce((total, item) => total + item.percent, 0);
  }, [deductionOptions, selectedDeductionIds]);

  const valueAfterDeduction = useMemo(() => {
    return marketValue * (1 - totalDeductionPercent / 100);
  }, [marketValue, totalDeductionPercent]);

  const selectedRecommendedProduct = useMemo(() => {
    return (
      recommendedProducts.find(
        (item) => item.productCode === selectedProductCode,
      ) ||
      recommendedProducts.find((item) => item.recommended) ||
      recommendedProducts[0]
    );
  }, [recommendedProducts, selectedProductCode]);

  const maxLoanByAppraisal = useMemo(() => {
    const ltv = selectedRecommendedProduct?.maxLtvPercent ?? selectedPackage.ltv;

    return Math.round(valueAfterDeduction * (ltv / 100));
  }, [selectedPackage.ltv, selectedRecommendedProduct, valueAfterDeduction]);

  const monthlyPayment = useMemo(() => {
    return Math.round(selectedRecommendedProduct?.estimatedMonthlyPayment ?? 0);
  }, [selectedRecommendedProduct]);

  const handleToggleDeduction = (id: string, checked: boolean) => {
    setSelectedDeductionIds((prev) => {
      if (checked) {
        return [...prev, id];
      }

      return prev.filter((item) => item !== id);
    });
  };

  const handleSelectTerm = (term: string) => {
    setSelectedTerm(term);

    form.setValue("term", term, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const getPreviewData = (): AssetValuationPreviewData | null => {
    if (!valuationResult) {
      return null;
    }

    return valuationResult.data || valuationResult;
  };

  const getValuationMarketValue = () => {
    const data = getPreviewData();

    return (
      data?.marketValue ??
      marketPriceResult?.data?.marketValue ??
      marketValue
    );
  };

  const getValuationTotalDeductionAmount = () => {
    const data = getPreviewData();

    const totalDeductionAmount = Number(data?.totalDeductionAmount ?? 0);

    if (totalDeductionAmount > 0) {
      return totalDeductionAmount;
    }

    const currentMarketValue = Number(
      data?.marketValue ?? marketPriceResult?.data?.marketValue ?? 0,
    );

    const currentFinalValue = Number(
      data?.finalValue ?? data?.valueAfterDeduction ?? 0,
    );

    if (currentMarketValue > 0 && currentFinalValue > 0) {
      return Math.max(currentMarketValue - currentFinalValue, 0);
    }

    return 0;
  };

  const getValuationDeductionRate = () => {
    const data = getPreviewData();

    return data?.totalDeductionRate ?? totalDeductionPercent;
  };

  const getValuationValueAfterDeduction = () => {
    const data = getPreviewData();

    return data?.finalValue ?? data?.valueAfterDeduction ?? valueAfterDeduction;
  };

  const getValuationMaxLoanAmount = () => {
    const data = getPreviewData();

    return (
      data?.loanableValue ??
      data?.maxLoanAmount ??
      selectedRecommendedProduct?.effectiveMaxLoanAmount ??
      selectedRecommendedProduct?.maxLoanByLtv ??
      maxLoanByAppraisal
    );
  };

  const getValuationLtv = () => {
    const data = getPreviewData();

    return (
      data?.ltvRatio ??
      data?.ltvRate ??
      data?.loanToValue ??
      selectedRecommendedProduct?.maxLtvPercent ??
      selectedPackage.ltv
    );
  };

  const adjustedAssetValueForRecommendation = Number(
    getValuationValueAfterDeduction(),
  );

  const buildPayload = (
    values: PreliminaryInfoFormValues,
  ): PreliminaryInfoPayload => {
    return {
      ...values,
      monthlyIncome: getDigitsOnly(values.monthlyIncome),
      desiredLoanAmount: getDigitsOnly(values.desiredLoanAmount),
      selectedDeductionIds,
      totalDeductionPercent: getValuationDeductionRate(),
      marketValue: getValuationMarketValue(),
      valueAfterDeduction: getValuationValueAfterDeduction(),
      selectedPackageId,
      selectedTerm,
      selectedProductCode:
        selectedRecommendedProduct?.productCode || selectedProductCode,
      recommendedProductCode:
        loanRecommendationResult?.data?.recommendedProductCode ||
        selectedRecommendedProduct?.productCode ||
        "",
      monthlyPayment,
      maxLoanByAppraisal: getValuationMaxLoanAmount(),
    };
  };

  const saveCurrentStep2ToSession = (values: PreliminaryInfoFormValues) => {
    const nextSessionData = {
      ...values,
      monthlyIncome: getDigitsOnly(values.monthlyIncome),
      desiredLoanAmount: getDigitsOnly(values.desiredLoanAmount),
      selectedDeductionIds,
      selectedPackageId,
      selectedTerm,
      selectedProductCode:
        selectedRecommendedProduct?.productCode || selectedProductCode,
      recommendedProductCode:
        loanRecommendationResult?.data?.recommendedProductCode ||
        selectedRecommendedProduct?.productCode ||
        "",
    } as unknown as Parameters<typeof saveStep2PreliminaryInfo>[0];

    saveStep2PreliminaryInfo(nextSessionData);
  };

  const buildDeductionItems = () => {
    return deductionOptions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .map((item) => ({
        type: item.id,
        rate: item.percent,
      }));
  };

  const buildAssetValuationPayload = (
    vehicleVariant: string,
    marketValueFromApi: number,
    deductionItems = buildDeductionItems(),
  ): AssetValuationPayload => {
    const values = form.getValues();

    return {
      assetSnapshot: {
        assetType: mapAssetTypeToApiValue(values.assetType),
        brand: String(values.brand || ""),
        model: String(values.model || ""),
        vehicleVariant,
        manufactureYear: Number(values.manufactureYear || 0),
        vehicleColor: String(values.color || ""),
        marketValue: marketValueFromApi,
      },
      deductionItems,
    };
  };

  const handleCalculateAssetValuation = async () => {
    const vehicleVariant = resolvedVehicleVariant?.value;

    if (!vehicleVariant) {
      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError("");
      valuationRequestSignatureRef.current = "";
      return;
    }

    const signature = JSON.stringify({
      vehicleVariant,
      deductionItems: buildDeductionItems()
        .slice()
        .sort((a, b) => a.type.localeCompare(b.type)),
    });

    if (signature === valuationRequestSignatureRef.current) {
      return;
    }

    valuationRequestSignatureRef.current = signature;

    setIsValuationLoading(true);
    setValuationError("");

    try {
      const marketPriceResponse = await assetValuationApi.getMarketPrice({
        vehicleVariant,
      });

      if (marketPriceResponse.success === false) {
        throw new Error(
          marketPriceResponse.message || "Không lấy được giá thị trường.",
        );
      }

      const marketValueFromApi = Number(
        marketPriceResponse.data?.marketValue || 0,
      );

      if (!marketValueFromApi) {
        throw new Error("API market-price không trả về marketValue hợp lệ.");
      }

      setMarketPriceResult(marketPriceResponse);

      const previewPayload = buildAssetValuationPayload(
        vehicleVariant,
        marketValueFromApi,
      );

      const previewResponse = await assetValuationApi.preview(previewPayload);

      if (previewResponse.success === false) {
        throw new Error(
          previewResponse.message || "Không tính được định giá sơ bộ.",
        );
      }

      setValuationResult(previewResponse);
      setValuationError("");
    } catch (error) {
      console.error("Auto asset valuation error:", error);

      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError(
        "Không thể tự động tính định giá sơ bộ. Vui lòng kiểm tra lại thông tin tài sản.",
      );

      valuationRequestSignatureRef.current = "";
    } finally {
      setIsValuationLoading(false);
    }
  };

  useEffect(() => {
    if (valuationTimerRef.current) {
      clearTimeout(valuationTimerRef.current);
    }

    if (!resolvedVehicleVariant?.value) {
      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError("");
      valuationRequestSignatureRef.current = "";
      return;
    }

    valuationTimerRef.current = setTimeout(() => {
      void handleCalculateAssetValuation();
    }, 500);

    return () => {
      if (valuationTimerRef.current) {
        clearTimeout(valuationTimerRef.current);
      }
    };
  }, [resolvedVehicleVariant?.value, selectedDeductionIds.join("|")]);

  useEffect(() => {
    let isMounted = true;

    const preloadDeductionAmounts = async () => {
      const vehicleVariant = resolvedVehicleVariant?.value;
      const currentMarketValue = Number(
        marketPriceResult?.data?.marketValue ?? 0,
      );

      if (
        !vehicleVariant ||
        currentMarketValue <= 0 ||
        deductionOptions.length === 0
      ) {
        setDeductionAmountsById({});
        return;
      }

      try {
        const resultEntries = await Promise.all(
          deductionOptions.map(async (deduction) => {
            const payload = buildAssetValuationPayload(
              vehicleVariant,
              currentMarketValue,
              [
                {
                  type: deduction.id,
                  rate: deduction.percent,
                },
              ],
            );

            const response = await assetValuationApi.preview(payload);
            const data = response.data || response;

            const totalDeductionAmount = Number(
              data?.totalDeductionAmount ?? 0,
            );

            const finalValue = Number(
              data?.finalValue ?? data?.valueAfterDeduction ?? 0,
            );

            const amountFromFinalValue =
              finalValue > 0
                ? Math.max(currentMarketValue - finalValue, 0)
                : 0;

            const amountFromPercent =
              deduction.percent > 0
                ? (currentMarketValue * deduction.percent) / 100
                : 0;

            const amount =
              totalDeductionAmount || amountFromFinalValue || amountFromPercent;

            return [deduction.id, amount] as const;
          }),
        );

        if (!isMounted) return;

        setDeductionAmountsById(Object.fromEntries(resultEntries));
      } catch (error) {
        console.error("Preload deduction amounts error:", error);

        if (!isMounted) return;

        setDeductionAmountsById({});
      }
    };

    void preloadDeductionAmounts();

    return () => {
      isMounted = false;
    };
  }, [
    resolvedVehicleVariant?.value,
    marketPriceResult?.data?.marketValue,
    deductionOptions,
  ]);

  useEffect(() => {
    if (loanRecommendationTimerRef.current) {
      clearTimeout(loanRecommendationTimerRef.current);
    }

    const requestedLoanAmount = Number(
      getDigitsOnly(String(watchedDesiredLoanAmount || "")),
    );

    if (
      !applicationCode ||
      !watchedLoanPurpose ||
      !watchedAssetType ||
      !watchedTerm ||
      requestedLoanAmount <= 0 ||
      adjustedAssetValueForRecommendation <= 0
    ) {
      setLoanRecommendationResult(null);
      setRecommendedProducts([]);
      setSelectedProductCode("");
      setLoanRecommendationError("");
      loanRecommendationSignatureRef.current = "";
      return;
    }

    const payload = {
      selectedLoanPurpose: String(watchedLoanPurpose),
      selectedAssetType: mapAssetTypeToApiValue(watchedAssetType),
      selectedTenor: Number(watchedTerm),
      requestedLoanAmount,
      adjustedAssetValue: adjustedAssetValueForRecommendation,
      scoreGrade,
    };

    const signature = JSON.stringify({
      applicationCode,
      payload,
    });

    if (signature === loanRecommendationSignatureRef.current) {
      return;
    }

    loanRecommendationTimerRef.current = setTimeout(async () => {
      loanRecommendationSignatureRef.current = signature;

      setIsLoanRecommendationLoading(true);
      setLoanRecommendationError("");

      try {
        const response = await loanProductRecommendationApi.recommend(
          applicationCode,
          payload,
        );

        if (response.success === false) {
          throw new Error(
            response.message || "Không lấy được đề xuất gói vay.",
          );
        }

        const products = response.data?.products || [];

        setLoanRecommendationResult(response);
        setRecommendedProducts(products);

        const nextSelectedProductCode =
          response.data?.recommendedProductCode ||
          products.find((item) => item.recommended)?.productCode ||
          products[0]?.productCode ||
          "";

        setSelectedProductCode((current) => {
          if (current && products.some((item) => item.productCode === current)) {
            return current;
          }

          return nextSelectedProductCode;
        });
      } catch (error) {
        console.error("Loan product recommendation error:", error);

        setLoanRecommendationResult(null);
        setRecommendedProducts([]);
        setSelectedProductCode("");
        setLoanRecommendationError(
          "Không thể lấy đề xuất gói vay. Vui lòng kiểm tra lại thông tin khoản vay và định giá tài sản.",
        );

        loanRecommendationSignatureRef.current = "";
      } finally {
        setIsLoanRecommendationLoading(false);
      }
    }, 600);

    return () => {
      if (loanRecommendationTimerRef.current) {
        clearTimeout(loanRecommendationTimerRef.current);
      }
    };
  }, [
    applicationCode,
    scoreGrade,
    watchedLoanPurpose,
    watchedAssetType,
    watchedTerm,
    watchedDesiredLoanAmount,
    adjustedAssetValueForRecommendation,
  ]);

  const handleSaveDraft = async () => {
    const values = form.getValues();
    const payload = buildPayload(values);

    saveCurrentStep2ToSession(values);

    try {
      await preliminaryInfoApi.saveDraft(payload);
      console.log("Đã lưu nháp bước 2:", payload);
    } catch (error) {
      console.error("Lưu nháp lỗi:", error);
    }
  };

  const handleSubmit = async (values: PreliminaryInfoFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = buildPayload(values);

      saveCurrentStep2ToSession(values);

      await preliminaryInfoApi.submit(payload);

      navigate({
        to: "/loan/customer-identify",
      });
    } catch (error) {
      console.error("Submit step 2 lỗi:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log("Huỷ hồ sơ");
  };

  const handleBack = () => {
    navigate({
      to: "/loan/customer-identify",
    });
  };

  const resetValuation = () => {
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
    setValuationError("");
    setDeductionAmountsById({});
    setLoanRecommendationResult(null);
    setRecommendedProducts([]);
    setSelectedProductCode("");
    setLoanRecommendationError("");
    valuationRequestSignatureRef.current = "";
    loanRecommendationSignatureRef.current = "";
  };

  const handleAssetTypeChange = () => {
    form.setValue("brand", "");
    form.setValue("model", "");
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleBrandOptions([]);
    setVehicleModelOptions([]);
    setVehicleVersionOptions([]);
    setManufactureYearOptions([]);
    setVehicleColorOptions([]);
    resetValuation();
  };

  const handleBrandChange = () => {
    form.setValue("model", "");
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleModelOptions([]);
    setVehicleVersionOptions([]);
    setManufactureYearOptions([]);
    setVehicleColorOptions([]);
    resetValuation();
  };

  const handleModelChange = () => {
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleVersionOptions([]);
    setManufactureYearOptions([]);
    setVehicleColorOptions([]);
    resetValuation();
  };

  const handleVersionChange = () => {
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setManufactureYearOptions([]);
    setVehicleColorOptions([]);
    resetValuation();
  };

  const handleManufactureYearChange = () => {
    form.setValue("color", "");

    setVehicleColorOptions([]);
    resetValuation();
  };

  const handleColorChange = () => {
    resetValuation();
  };

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <main className="min-h-screen">
        <section className="px-8 py-6">
          <CustomerIdentifyBreadcrumb currentStep={CURRENT_STEP} />

          <div className="overflow-x-auto pb-2">
            <LoanOnboardingStepper currentStep={CURRENT_STEP} />
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <SectionCard
                title="Thông tin sơ bộ khách hàng"
                icon={
                  <TickCircle size={24} color="#009b3a" variant="Outline" />
                }
                iconClassName="bg-[#e9f8ee]"
                rightContent={
                  <span className="text-sm text-[#4b5563]">
                    Đã tự điền từ OCR bước 1
                  </span>
                }
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <TextInputField
                    form={form}
                    name="fullName"
                    label="Họ và tên"
                    required
                    placeholder="Nhập họ và tên"
                    className="bg-[#f8fbf8]"
                  />

                  <TextInputField
                    form={form}
                    name="identityNumber"
                    label="Số CCCD"
                    placeholder="Nhập số CCCD"
                    className="bg-[#f8fbf8]"
                    onlyNumber
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                  <TextInputField
                    form={form}
                    name="phoneNumber"
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                    className="bg-[#f8fbf8]"
                    onlyNumber
                    inputMode="numeric"
                    maxLength={11}
                  />

                  <DateOfBirthField form={form} />

                  <SelectField
                    form={form}
                    name="gender"
                    label="Giới tính"
                    required
                    placeholder="Chọn giới tính"
                    options={genderOptions}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <SelectField
                    form={form}
                    name="job"
                    label="Nghề nghiệp"
                    placeholder="Chọn nghề nghiệp"
                    options={occupationOptions}
                  />

                  <TextInputField
                    form={form}
                    name="monthlyIncome"
                    label="Thu nhập hàng tháng"
                    placeholder="VD: 1.000.000 Đ"
                    inputMode="numeric"
                    formatCurrencyVnd
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                  <SelectField
                    form={form}
                    name="loanPurpose"
                    label="Mục đích vay"
                    placeholder="Chọn mục đích"
                    options={loanPurposeOptions}
                  />

                  <TextInputField
                    form={form}
                    name="desiredLoanAmount"
                    label="Số tiền mong muốn vay"
                    required
                    placeholder="VD: 10.000.000 Đ"
                    inputMode="numeric"
                    formatCurrencyVnd
                  />

                  <SelectField
                    form={form}
                    name="term"
                    label="Kỳ hạn (tháng)"
                    placeholder="Chọn kỳ hạn"
                    onAfterChange={handleSelectTerm}
                    options={[
                      { label: "12 tháng", value: "12" },
                      { label: "36 tháng", value: "36" },
                      { label: "48 tháng", value: "48" },
                      { label: "72 tháng", value: "72" },
                    ]}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Thông tin sơ bộ tài sản"
                icon={<Car size={24} color="#8a6d00" variant="Outline" />}
                iconClassName="bg-[#fff6d8]"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                  <SelectField
                    form={form}
                    name="assetType"
                    label="Loại tài sản"
                    required
                    placeholder="Chọn loại tài sản"
                    options={assetTypeOptions}
                    onAfterChange={handleAssetTypeChange}
                  />

                  <SelectField
                    form={form}
                    name="brand"
                    label="Hãng xe"
                    placeholder="Chọn loại tài sản trước"
                    disabled={!form.watch("assetType")}
                    options={vehicleBrandOptions}
                    onAfterChange={handleBrandChange}
                  />

                  <SelectField
                    form={form}
                    name="model"
                    label="Dòng xe"
                    placeholder="Chọn hãng trước"
                    disabled={!form.watch("brand")}
                    options={vehicleModelOptions}
                    onAfterChange={handleModelChange}
                  />

                  <SelectField
                    form={form}
                    name="version"
                    label="Phiên bản xe"
                    placeholder="Chọn dòng xe trước"
                    disabled={!form.watch("model")}
                    options={vehicleVersionOptions}
                    onAfterChange={handleVersionChange}
                  />

                  <SelectField
                    form={form}
                    name="manufactureYear"
                    label="Năm sản xuất"
                    placeholder="Chọn phiên bản trước"
                    disabled={!form.watch("version")}
                    options={manufactureYearOptions}
                    onAfterChange={handleManufactureYearChange}
                  />

                  <SelectField
                    form={form}
                    name="color"
                    label="Màu xe"
                    placeholder="Chọn năm sản xuất trước"
                    disabled={!form.watch("manufactureYear")}
                    options={vehicleColorOptions}
                    onAfterChange={handleColorChange}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Yếu tố giảm trừ giá trị"
                icon={
                  <Calculator size={24} color="#ef4444" variant="Outline" />
                }
                iconClassName="bg-[#ffe4e8]"
              >
                <DeductionList
                  deductions={deductionOptions}
                  selectedIds={selectedDeductionIds}
                  marketValue={Number(getValuationMarketValue())}
                  deductionAmountsById={deductionAmountsById}
                  onToggle={handleToggleDeduction}
                />
              </SectionCard>

              <SectionCard
                title="Định giá sơ bộ"
                icon={
                  <Calculator size={24} color="#009b3a" variant="Outline" />
                }
                iconClassName="bg-[#e9f8ee]"
              >
                <AppraisalSummary
                  marketValue={getValuationMarketValue()}
                  totalDeductionPercent={getValuationDeductionRate()}
                  totalDeductionAmount={getValuationTotalDeductionAmount()}
                  valueAfterDeduction={getValuationValueAfterDeduction()}
                  maxLoanByAppraisal={getValuationMaxLoanAmount()}
                  ltv={getValuationLtv()}
                  isLoading={isValuationLoading}
                />

                {valuationError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {valuationError}
                  </div>
                )}

                {resolvedVehicleVariant &&
                  marketPriceResult &&
                  valuationResult &&
                  !valuationError && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      Đã resolve biến thể xe, lấy giá thị trường và tính định
                      giá sơ bộ thành công.
                    </div>
                  )}
              </SectionCard>

              <SectionCard
                title="Đề xuất khoản vay"
                icon={
                  <DocumentText size={24} color="#009b3a" variant="Outline" />
                }
                iconClassName="bg-[#e9f8ee]"
              >
                <LoanPackageSelector
                  products={recommendedProducts}
                  recommendedProductCode={
                    loanRecommendationResult?.data?.recommendedProductCode
                  }
                  selectedProductCode={selectedProductCode}
                  selectedTerm={selectedTerm}
                  requestedLoanAmount={Number(
                    getDigitsOnly(form.watch("desiredLoanAmount") || ""),
                  )}
                  isLoading={isLoanRecommendationLoading}
                  error={
                    !applicationCode
                      ? "Chưa có applicationCode nên chưa thể gọi API đề xuất gói vay."
                      : loanRecommendationError
                  }
                  onSelectProduct={setSelectedProductCode}
                  onSelectTerm={handleSelectTerm}
                />
              </SectionCard>

              <BottomActions
                isSubmitting={isSubmitting}
                onSaveDraft={handleSaveDraft}
                onCancel={handleCancel}
                onBack={handleBack}
              />
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
}
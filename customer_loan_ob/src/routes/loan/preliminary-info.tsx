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
  AssetValuationMarketPriceParams,
  AssetValuationMarketPriceResponse,
  AssetValuationPayload,
  AssetValuationPreviewData,
  AssetValuationResponse,
} from "@/features/preliminary-info/types/asset-valuation.type";

import type {
  ReferenceDataItem,
  ReferenceOption,
} from "@/features/preliminary-info/types/reference-data.type";

export const Route = createFileRoute("/loan/preliminary-info")({
  component: PreliminaryInfoScreen,
});

const CURRENT_STEP = 2;

type QueryParams = Record<string, string | number | boolean | undefined>;

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
      percent: Number(item.rate ?? item.percent ?? 0),
    }))
    .filter((item) => item.id && item.label);
}

async function loadOptionsWithAttempts(
  label: string,
  request: (params?: QueryParams) => Promise<unknown>,
  attempts: Array<QueryParams | undefined>,
): Promise<ReferenceOption[]> {
  for (const params of attempts) {
    try {
      const response = await request(params);
      const options = mapReferenceOptions(response);

      console.log(`${label} params:`, params);
      console.log(`${label} response:`, response);
      console.log(`${label} options:`, options);

      if (options.length > 0) {
        return options;
      }
    } catch (error) {
      console.error(`${label} error with params:`, params, error);
    }
  }

  return [];
}

async function loadDeductionItems(): Promise<DeductionItem[]> {
  try {
    const response = await referenceDataApi.getValuationDeductionFactors();
    return mapDeductionItems(response);
  } catch (error) {
    console.error("Load deduction factors error:", error);
    return [];
  }
}

function PreliminaryInfoScreen() {
  const navigate = useNavigate();

  const step1Identity = getStep1Identity();
  const step2Session = getStep2PreliminaryInfo();

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
  ] = useWatch({
    control: form.control,
    name: [
      "assetType",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "color",
    ],
  });

  useEffect(() => {
    let isMounted = true;

    const loadInitialReferenceData = async () => {
      try {
        const [
          assetTypeOptionsResult,
          genderOptionsResult,
          occupationOptionsResult,
          loanPurposeOptionsResult,
          manufactureYearOptionsResult,
          deductionOptionsResult,
        ] = await Promise.all([
          loadOptionsWithAttempts(
            "Asset types",
            referenceDataApi.getAssetTypes,
            [undefined, { active: true }, { status: "ACTIVE" }],
          ),
          loadOptionsWithAttempts("Genders", referenceDataApi.getGenders, [
            undefined,
            { active: true },
            { status: "ACTIVE" },
          ]),
          loadOptionsWithAttempts(
            "Occupations",
            referenceDataApi.getOccupations,
            [
              undefined,
              { active: true },
              { enabled: true },
              { status: "ACTIVE" },
              { type: "OCCUPATION" },
              { category: "OCCUPATION" },
              { group: "OCCUPATION" },
            ],
          ),
          loadOptionsWithAttempts(
            "Loan purposes",
            referenceDataApi.getLoanPurposes,
            [undefined, { active: true }, { status: "ACTIVE" }],
          ),
          loadOptionsWithAttempts(
            "Manufacture years",
            referenceDataApi.getManufactureYears,
            [undefined, { active: true }, { status: "ACTIVE" }],
          ),
          loadDeductionItems(),
        ]);

        if (!isMounted) return;

        setAssetTypeOptions(assetTypeOptionsResult);
        setGenderOptions(genderOptionsResult);
        setOccupationOptions(occupationOptionsResult);
        setLoanPurposeOptions(loanPurposeOptionsResult);
        setManufactureYearOptions(manufactureYearOptionsResult);
        setDeductionOptions(deductionOptionsResult);
      } catch (error) {
        console.error("Load initial reference data error:", error);

        if (!isMounted) return;

        setAssetTypeOptions([]);
        setGenderOptions([]);
        setOccupationOptions([]);
        setLoanPurposeOptions([]);
        setManufactureYearOptions([]);
        setDeductionOptions([]);
      }
    };

    void loadInitialReferenceData();

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

      const assetType = mapAssetTypeToApiValue(watchedAssetType);

      const options = await loadOptionsWithAttempts(
        "Vehicle brands",
        referenceDataApi.getVehicleBrands,
        [
          { assetType, assetTypeCode: assetType },
          { assetTypeCode: assetType },
          { assetType },
          undefined,
        ],
      );

      if (!isMounted) return;

      setVehicleBrandOptions(options);
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

      const assetType = mapAssetTypeToApiValue(watchedAssetType);
      const brand = String(watchedBrand);

      const options = await loadOptionsWithAttempts(
        "Vehicle models",
        referenceDataApi.getVehicleModels,
        [
          {
            assetType,
            assetTypeCode: assetType,
            brand,
            brandCode: brand,
          },
          {
            assetTypeCode: assetType,
            brandCode: brand,
          },
          {
            assetType,
            brand,
          },
          {
            brandCode: brand,
          },
          {
            brand,
          },
          undefined,
        ],
      );

      if (!isMounted) return;

      setVehicleModelOptions(options);
    };

    void loadVehicleModels();

    return () => {
      isMounted = false;
    };
  }, [watchedAssetType, watchedBrand]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleVersions = async () => {
      if (!watchedModel) {
        setVehicleVersionOptions([]);
        return;
      }

      const assetType = mapAssetTypeToApiValue(watchedAssetType);
      const brand = String(watchedBrand || "");
      const model = String(watchedModel);

      const options = await loadOptionsWithAttempts(
        "Vehicle versions",
        referenceDataApi.getVehicleVersions,
        [
          {
            assetType,
            assetTypeCode: assetType,
            brand,
            brandCode: brand,
            model,
            modelCode: model,
          },
          {
            assetTypeCode: assetType,
            brandCode: brand,
            modelCode: model,
          },
          {
            brandCode: brand,
            modelCode: model,
          },
          {
            modelCode: model,
          },
          {
            model,
          },
          undefined,
        ],
      );

      if (!isMounted) return;

      setVehicleVersionOptions(options);
    };

    void loadVehicleVersions();

    return () => {
      isMounted = false;
    };
  }, [watchedAssetType, watchedBrand, watchedModel]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleColors = async () => {
      if (!watchedAssetType) {
        setVehicleColorOptions([]);
        return;
      }

      const assetType = mapAssetTypeToApiValue(watchedAssetType);

      const options = await loadOptionsWithAttempts(
        "Vehicle colors",
        referenceDataApi.getVehicleColors,
        [
          {
            assetType,
            assetTypeCode: assetType,
            brand: String(watchedBrand || ""),
            brandCode: String(watchedBrand || ""),
            model: String(watchedModel || ""),
            modelCode: String(watchedModel || ""),
            vehicleVersion: String(watchedVersion || ""),
            vehicleVersionCode: String(watchedVersion || ""),
          },
          { assetTypeCode: assetType },
          { assetType },
          undefined,
        ],
      );

      if (!isMounted) return;

      setVehicleColorOptions(options);
    };

    void loadVehicleColors();

    return () => {
      isMounted = false;
    };
  }, [watchedAssetType, watchedBrand, watchedModel, watchedVersion]);

  useEffect(() => {
    let isMounted = true;

    const loadResolvedVehicleVariant = async () => {
      if (
        !watchedAssetType ||
        !watchedBrand ||
        !watchedModel ||
        !watchedVersion ||
        !watchedManufactureYear ||
        !watchedColor
      ) {
        setResolvedVehicleVariant(null);
        return;
      }

      const assetType = mapAssetTypeToApiValue(watchedAssetType);

      const options = await loadOptionsWithAttempts(
        "Vehicle variant",
        referenceDataApi.getVehicleVariant,
        [
          {
            assetType,
            assetTypeCode: assetType,
            brand: String(watchedBrand),
            brandCode: String(watchedBrand),
            model: String(watchedModel),
            modelCode: String(watchedModel),
            vehicleVersion: String(watchedVersion),
            vehicleVersionCode: String(watchedVersion),
            manufactureYear: Number(watchedManufactureYear),
            vehicleColor: String(watchedColor),
            vehicleColorCode: String(watchedColor),
          },
          {
            modelCode: String(watchedModel),
            vehicleVersionCode: String(watchedVersion),
            manufactureYear: Number(watchedManufactureYear),
            vehicleColorCode: String(watchedColor),
          },
        ],
      );

      if (!isMounted) return;

      setResolvedVehicleVariant(options[0] || null);
    };

    void loadResolvedVehicleVariant();

    return () => {
      isMounted = false;
    };
  }, [
    watchedAssetType,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedColor,
  ]);

  const marketValue =
    valuationResult?.data?.marketValue ??
    valuationResult?.marketValue ??
    marketPriceResult?.data?.marketValue ??
    0;

  const totalDeductionPercent = useMemo(() => {
    return deductionOptions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .reduce((total, item) => total + item.percent, 0);
  }, [deductionOptions, selectedDeductionIds]);

  const valueAfterDeduction = useMemo(() => {
    return marketValue * (1 - totalDeductionPercent / 100);
  }, [marketValue, totalDeductionPercent]);

  const selectedPackage = useMemo(() => {
    return (
      loanPackages.find((item) => item.id === selectedPackageId) ||
      loanPackages[1]
    );
  }, [selectedPackageId]);

  const maxLoanByAppraisal = useMemo(() => {
    return Math.round(valueAfterDeduction * (selectedPackage.ltv / 100));
  }, [selectedPackage, valueAfterDeduction]);

  const monthlyPayment = useMemo(() => {
    const term = Number(selectedTerm || 12);
    const principal = selectedPackage.maxLoanAmount;
    const monthlyInterest = principal * (selectedPackage.interestRate / 100);
    const monthlyPrincipal = principal / term;

    return Math.round(monthlyPrincipal + monthlyInterest);
  }, [selectedPackage, selectedTerm]);

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
      data?.estimatedValue ??
      marketPriceResult?.data?.marketValue ??
      marketValue
    );
  };

  const getValuationDeductionRate = () => {
    const data = getPreviewData();

    return data?.totalDeductionRate ?? totalDeductionPercent;
  };

  const getValuationValueAfterDeduction = () => {
    const data = getPreviewData();

    return data?.valueAfterDeduction ?? data?.finalValue ?? valueAfterDeduction;
  };

  const getValuationMaxLoanAmount = () => {
    const data = getPreviewData();

    return data?.maxLoanAmount ?? maxLoanByAppraisal;
  };

  const getValuationLtv = () => {
    const data = getPreviewData();

    return data?.ltvRate ?? data?.loanToValue ?? selectedPackage.ltv;
  };

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
      monthlyPayment,
      maxLoanByAppraisal: getValuationMaxLoanAmount(),
    };
  };

  const saveCurrentStep2ToSession = (values: PreliminaryInfoFormValues) => {
    saveStep2PreliminaryInfo({
      ...values,
      selectedDeductionIds,
      selectedPackageId,
      selectedTerm,
    });
  };

  const buildDeductionItems = () => {
    return deductionOptions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .map((item) => ({
        type: item.id,
        rate: item.percent,
      }));
  };

  const getMissingAssetFields = () => {
    const values = form.getValues();

    const missingFields: string[] = [];

    if (!values.assetType) missingFields.push("Loại tài sản");
    if (!values.brand) missingFields.push("Hãng xe");
    if (!values.model) missingFields.push("Dòng xe");
    if (!values.version) missingFields.push("Phiên bản xe");
    if (!values.manufactureYear) missingFields.push("Năm sản xuất");
    if (!values.color) missingFields.push("Màu xe");

    return missingFields;
  };

  const buildMarketPriceParams = (): AssetValuationMarketPriceParams => {
    const values = form.getValues();

    return {
      assetType: mapAssetTypeToApiValue(values.assetType),
      brand: String(values.brand || ""),
      model: String(values.model || ""),
      vehicleVariant: String(
        resolvedVehicleVariant?.value || values.version || "",
      ),
      manufactureYear: Number(values.manufactureYear || 0),
      vehicleColor: String(values.color || ""),
    };
  };

  const buildAssetValuationPayload = (): AssetValuationPayload => {
    const marketPriceParams = buildMarketPriceParams();

    return {
      assetSnapshot: {
        assetType: marketPriceParams.assetType,
        brand: marketPriceParams.brand,
        model: marketPriceParams.model,
        vehicleVariant: marketPriceParams.vehicleVariant,
        manufactureYear: marketPriceParams.manufactureYear,
        vehicleColor: marketPriceParams.vehicleColor,
      },
      deductionItems: buildDeductionItems(),
    };
  };

  const buildAssetValuationSignature = () => {
    const payload = buildAssetValuationPayload();

    return JSON.stringify({
      assetSnapshot: payload.assetSnapshot,
      deductionItems: payload.deductionItems
        .slice()
        .sort((a, b) => a.type.localeCompare(b.type)),
    });
  };

  const handleCalculateAssetValuation = async () => {
    const missingFields = getMissingAssetFields();

    if (missingFields.length > 0) {
      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError("");
      valuationRequestSignatureRef.current = "";
      return;
    }

    const isValidAssetForm = await form.trigger([
      "assetType",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "color",
    ]);

    if (!isValidAssetForm) {
      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError(
        "Vui lòng nhập đúng thông tin tài sản trước khi định giá.",
      );
      return;
    }

    const signature = buildAssetValuationSignature();

    if (signature === valuationRequestSignatureRef.current) {
      return;
    }

    valuationRequestSignatureRef.current = signature;

    setIsValuationLoading(true);
    setValuationError("");

    try {
      const marketPriceParams = buildMarketPriceParams();

      const marketPriceResponse =
        await assetValuationApi.getMarketPrice(marketPriceParams);

      if (!marketPriceResponse.success) {
        throw new Error(
          marketPriceResponse.message || "Không lấy được giá thị trường.",
        );
      }

      setMarketPriceResult(marketPriceResponse);

      const previewPayload = buildAssetValuationPayload();

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

    const missingFields = getMissingAssetFields();

    if (missingFields.length > 0) {
      setMarketPriceResult(null);
      setValuationResult(null);
      setValuationError("");
      valuationRequestSignatureRef.current = "";
      return;
    }

    valuationTimerRef.current = setTimeout(() => {
      void handleCalculateAssetValuation();
    }, 700);

    return () => {
      if (valuationTimerRef.current) {
        clearTimeout(valuationTimerRef.current);
      }
    };
  }, [
    watchedAssetType,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedColor,
    resolvedVehicleVariant?.value,
    selectedDeductionIds.join("|"),
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

  const handleAssetTypeChange = () => {
    form.setValue("brand", "");
    form.setValue("model", "");
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleBrandOptions([]);
    setVehicleModelOptions([]);
    setVehicleVersionOptions([]);
    setVehicleColorOptions([]);
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
  };

  const handleBrandChange = () => {
    form.setValue("model", "");
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleModelOptions([]);
    setVehicleVersionOptions([]);
    setVehicleColorOptions([]);
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
  };

  const handleModelChange = () => {
    form.setValue("version", "");
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleVersionOptions([]);
    setVehicleColorOptions([]);
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
  };

  const handleVersionChange = () => {
    form.setValue("manufactureYear", "");
    form.setValue("color", "");

    setVehicleColorOptions([]);
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
  };

  const handleManufactureYearChange = () => {
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
  };

  const handleColorChange = () => {
    setResolvedVehicleVariant(null);
    setMarketPriceResult(null);
    setValuationResult(null);
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
                    placeholder="VD: 10.000.000 "
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
                    placeholder="Chọn hãng"
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
                    placeholder="Chọn phiên bản"
                    disabled={!form.watch("model")}
                    options={vehicleVersionOptions}
                    onAfterChange={handleVersionChange}
                  />

                  <SelectField
                    form={form}
                    name="manufactureYear"
                    label="Năm sản xuất"
                    placeholder="Chọn năm"
                    options={manufactureYearOptions}
                    onAfterChange={handleManufactureYearChange}
                  />

                  <SelectField
                    form={form}
                    name="color"
                    label="Màu xe"
                    placeholder="Chọn màu"
                    disabled={!form.watch("assetType")}
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

                {marketPriceResult && valuationResult && !valuationError && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    Đã tự động lấy giá thị trường và tính định giá sơ bộ thành
                    công.
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
                  loanPackages={loanPackages}
                  selectedPackageId={selectedPackageId}
                  selectedTerm={selectedTerm}
                  monthlyPayment={monthlyPayment}
                  onSelectPackage={setSelectedPackageId}
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
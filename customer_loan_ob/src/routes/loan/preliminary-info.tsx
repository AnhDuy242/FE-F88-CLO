import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Calculator, Car, DocumentText, TickCircle } from "iconsax-react";

import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import {
  formatCurrencyVnd,
  onlyDigits,
  parseMoneyInput,
} from "@/lib/currency";
import {
  normalizeDateForDisplay,
  parseDisplayDateToApi,
} from "@/lib/date";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";

import {
  saveStep2PreliminaryInfo,
  useLoanOnboardingStore,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";

import { preliminaryInfoApi } from "@/features/preliminary-info/api/preliminary-info.api";
import { assetValuationApi } from "@/features/preliminary-info/api/asset-valuation.api";
import { referenceDataApi } from "@/features/preliminary-info/api/reference-data.api";
import { loanProductRecommendationApi } from "@/features/preliminary-info/api/loan-product-recommendation.api";

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
  SaveLoanApplicationDraftPayload,
} from "@/features/preliminary-info/types/preliminary-info.type";

import type {
  AssetTypeApiValue,
  AssetValuationMarketPriceResponse,
  AssetValuationPayload,
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

function getDigitsOnly(value?: string) {
  return onlyDigits(value);
}

function getMoneyRawDigitsForDefaultValue(value?: string) {
  return onlyDigits(value);
}

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

function getScoreGradeFromStorage(step1: unknown, step2: unknown) {
  return (
    getStringFromUnknownObject(step2, ["scoreGrade", "creditScoreGrade"]) ||
    getStringFromUnknownObject(step1, ["scoreGrade", "creditScoreGrade"])
  );
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

  return normalizedValue;
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

  return normalizedValue;
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
  const storeApplicationCode = useLoanOnboardingStore(
    (state) => state.applicationCode,
  );
  const setApplicationCode = useLoanOnboardingStore(
    (state) => state.setApplicationCode,
  );
  const setSelectedLoanProduct = useLoanOnboardingStore(
    (state) => state.setSelectedLoanProduct,
  );
  const setLoanRecommendation = useLoanOnboardingStore(
    (state) => state.setLoanRecommendation,
  );
  const setCurrentStep = useLoanOnboardingStore((state) => state.setCurrentStep);
  const selectedCustomer = useLoanOnboardingStore(
    (state) => state.selectedCustomer,
  );
  const step1Identity = useLoanOnboardingStore(
    (state) => state.step1CustomerIdentify,
  );
  const step2Session = useLoanOnboardingStore(
    (state) => state.step2PreliminaryInfo,
  );

  const step1StorageData = step1Identity as Record<string, unknown> | null;
  const step2StorageData = step2Session as Record<string, unknown> | null;
  const selectedCustomerData = selectedCustomer as Record<string, unknown> | null;

  const scoreGrade = getScoreGradeFromStorage(
    step1StorageData,
    step2StorageData,
  );

  const initialGender = normalizeGender(
    getStringFromUnknownObject(selectedCustomerData, ["gender", "sex"]) ||
      step2Session?.gender ||
      step1Identity?.gender ||
      mapOcrSexToGender(step1Identity?.sex),
  );

  const [selectedDeductionIds, setSelectedDeductionIds] = useState<string[]>(
    step2Session?.selectedDeductionIds || [],
  );

  const [selectedTerm, setSelectedTerm] = useState(
    step2Session?.selectedTerm || step2Session?.term || "",
  );
  const hasAutoFilledCustomerInfo = Boolean(
    step1Identity?.fullName ||
      step1Identity?.identityNumber ||
      step1Identity?.phoneNumber ||
      step1Identity?.dateOfBirth ||
      selectedCustomerData,
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
  const [occupationOptions, setOccupationOptions] = useState<ReferenceOption[]>(
    [],
  );
  const [loanPurposeOptions, setLoanPurposeOptions] = useState<
    ReferenceOption[]
  >([]);
  const [loanTermOptions, setLoanTermOptions] = useState<ReferenceOption[]>([]);
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

  const [deductionAmountsById, setDeductionAmountsById] = useState<
    Record<string, number>
  >({});

  const [resolvedVehicleVariant, setResolvedVehicleVariant] =
    useState<ReferenceOption | null>(null);

  const valuationRequestSignatureRef = useRef("");
  const valuationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<PreliminaryInfoFormValues>({
    resolver: zodResolver(preliminaryInfoSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fullName:
        getStringFromUnknownObject(selectedCustomerData, [
          "fullName",
          "customerName",
        ]) ||
        step2Session?.fullName ||
        step1Identity?.fullName ||
        "",
      identityNumber:
        getStringFromUnknownObject(selectedCustomerData, [
          "identifierNumber",
          "identityNumber",
          "cccdNumber",
        ]) ||
        step2Session?.identityNumber ||
        step1Identity?.identityNumber ||
        "",
      phoneNumber:
        getStringFromUnknownObject(selectedCustomerData, ["phoneNumber"]) ||
        step2Session?.phoneNumber ||
        step1Identity?.phoneNumber ||
        "",
      dateOfBirth:
        normalizeDateForDisplay(
          getStringFromUnknownObject(selectedCustomerData, [
            "dateOfBirth",
            "birthDate",
          ]) ||
            step2Session?.dateOfBirth ||
            step1Identity?.dateOfBirth,
        ) || "",

      gender: initialGender,
      job: step2Session?.job || "",
      monthlyIncome: getMoneyRawDigitsForDefaultValue(
        step2Session?.monthlyIncome,
      ),
      loanPurpose: step2Session?.loanPurpose || "",
      desiredLoanAmount: getMoneyRawDigitsForDefaultValue(
        step2Session?.desiredLoanAmount,
      ),
      term: step2Session?.term || step2Session?.selectedTerm || "",

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
    const setPrefillValue = (
      name: keyof PreliminaryInfoFormValues,
      value?: string,
      overwrite = false,
    ) => {
      if (!value || (!overwrite && form.getValues(name))) {
        return;
      }

      form.setValue(name, value, {
        shouldDirty: false,
        shouldValidate: false,
      });
    };

    const selectedFullName = getStringFromUnknownObject(selectedCustomerData, [
      "fullName",
      "customerName",
    ]);
    const selectedIdentityNumber = getStringFromUnknownObject(
      selectedCustomerData,
      ["identifierNumber", "identityNumber", "cccdNumber"],
    );
    const selectedPhoneNumber = getStringFromUnknownObject(selectedCustomerData, [
      "phoneNumber",
    ]);
    const selectedDateOfBirth = getStringFromUnknownObject(selectedCustomerData, [
      "dateOfBirth",
      "birthDate",
    ]);
    const selectedGender = getStringFromUnknownObject(selectedCustomerData, [
      "gender",
      "sex",
    ]);

    setPrefillValue(
      "fullName",
      selectedFullName || step2Session.fullName || step1Identity.fullName,
      Boolean(selectedFullName),
    );
    setPrefillValue(
      "identityNumber",
      selectedIdentityNumber ||
        step2Session.identityNumber ||
        step1Identity.identityNumber,
      Boolean(selectedIdentityNumber),
    );
    setPrefillValue(
      "phoneNumber",
      selectedPhoneNumber || step2Session.phoneNumber || step1Identity.phoneNumber,
      Boolean(selectedPhoneNumber),
    );
    setPrefillValue(
      "dateOfBirth",
      normalizeDateForDisplay(
        selectedDateOfBirth || step2Session.dateOfBirth || step1Identity.dateOfBirth,
      ),
      Boolean(selectedDateOfBirth),
    );
    setPrefillValue(
      "gender",
      normalizeGender(
        selectedGender ||
          step2Session.gender ||
          step1Identity.gender ||
          mapOcrSexToGender(step1Identity.sex),
      ),
      Boolean(selectedGender),
    );
  }, [
    form,
    selectedCustomerData,
    step1Identity.dateOfBirth,
    step1Identity.fullName,
    step1Identity.gender,
    step1Identity.identityNumber,
    step1Identity.phoneNumber,
    step1Identity.sex,
    step2Session.dateOfBirth,
    step2Session.fullName,
    step2Session.gender,
    step2Session.identityNumber,
    step2Session.phoneNumber,
  ]);

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

    const loadLoanTerms = async () => {
      try {
        const response = await referenceDataApi.getLoanTerms();
        const options = mapReferenceOptions(response);

        if (!isMounted) return;

        setLoanTermOptions(options);

        const currentTerm = form.getValues("term") || selectedTerm;
        const hasCurrentTerm = options.some((option) => option.value === currentTerm);
        const fallbackTerm = options[0]?.value || "";

        if (!hasCurrentTerm && fallbackTerm) {
          setSelectedTerm(fallbackTerm);
          form.setValue("term", fallbackTerm, {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
      } catch (error) {
        console.error("Load loan terms error:", error);

        if (!isMounted) return;

        setLoanTermOptions([]);
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
      loadLoanTerms(),
      loadDeductionFactors(),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const currentGender = form.getValues("gender");

    if (!currentGender || genderOptions.length === 0) {
      return;
    }

    const normalizedGender = normalizeGender(currentGender);

    const matchedOption = genderOptions.find((option) => {
      return (
        normalizeGender(option.value) === normalizedGender ||
        normalizeGender(option.label) === normalizedGender
      );
    });

    if (matchedOption && matchedOption.value !== currentGender) {
      form.setValue("gender", matchedOption.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, genderOptions]);

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

  const previewData = useMemo(() => {
    if (!valuationResult) return null;

    return valuationResult.data || valuationResult;
  }, [valuationResult]);

  const selectedRecommendedProduct = useMemo(() => {
    return (
      recommendedProducts.find(
        (item) => item.productCode === selectedProductCode,
      ) ||
      recommendedProducts.find((item) => item.recommended) ||
      recommendedProducts[0]
    );
  }, [recommendedProducts, selectedProductCode]);

  const marketValue = useMemo(() => {
    return (
      getNumberFromUnknownObject(previewData, ["marketValue"]) ||
      getNumberFromUnknownObject(marketPriceResult?.data, ["marketValue"]) ||
      getNumberFromUnknownObject(marketPriceResult, ["marketValue"]) ||
      0
    );
  }, [marketPriceResult, previewData]);

  const totalDeductionPercent = useMemo(() => {
    return deductionOptions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .reduce((total, item) => total + item.percent, 0);
  }, [deductionOptions, selectedDeductionIds]);

  const totalDeductionAmount = useMemo(() => {
    if (selectedDeductionIds.length === 0) {
      return 0;
    }

    const selectedDeductionAmount = selectedDeductionIds.reduce(
      (total, deductionId) => {
        return total + Number(deductionAmountsById[deductionId] ?? 0);
      },
      0,
    );

    if (selectedDeductionAmount > 0) {
      return selectedDeductionAmount;
    }

    const totalDeductionAmountFromApi = getNumberFromUnknownObject(
      previewData,
      ["totalDeductionAmount"],
    );

    if (totalDeductionAmountFromApi > 0) {
      return totalDeductionAmountFromApi;
    }

    const finalValueFromApi = getNumberFromUnknownObject(previewData, [
      "finalValue",
      "valueAfterDeduction",
    ]);

    if (marketValue > 0 && finalValueFromApi > 0) {
      return Math.max(marketValue - finalValueFromApi, 0);
    }

    const fallbackAmountFromPercent =
      marketValue > 0 && totalDeductionPercent > 0
        ? (marketValue * totalDeductionPercent) / 100
        : 0;

    return fallbackAmountFromPercent;
  }, [
    deductionAmountsById,
    marketValue,
    previewData,
    selectedDeductionIds,
    totalDeductionPercent,
  ]);

  const valueAfterDeduction = useMemo(() => {
    if (marketValue <= 0) {
      return 0;
    }

    if (selectedDeductionIds.length === 0) {
      return marketValue;
    }

    if (totalDeductionAmount > 0) {
      return Math.max(marketValue - totalDeductionAmount, 0);
    }

    const finalValueFromApi = getNumberFromUnknownObject(previewData, [
      "finalValue",
      "valueAfterDeduction",
    ]);

    if (finalValueFromApi > 0) {
      return finalValueFromApi;
    }

    return marketValue;
  }, [
    marketValue,
    previewData,
    selectedDeductionIds.length,
    totalDeductionAmount,
  ]);

  const appraisalLtvPercent = useMemo(() => {
    return Number(selectedRecommendedProduct?.maxLtvPercent || 0);
  }, [selectedRecommendedProduct]);

  const maxLoanByAppraisal = useMemo(() => {
    const adjustedAssetValue = Number(valueAfterDeduction);

    if (adjustedAssetValue <= 0) {
      return 0;
    }

    return Math.round(adjustedAssetValue * (appraisalLtvPercent / 100));
  }, [appraisalLtvPercent, valueAfterDeduction]);

  const handleToggleDeduction = (id: string, checked: boolean) => {
    setSelectedDeductionIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;

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

  const getValuationMarketValue = () => marketValue;

  const getValuationTotalDeductionAmount = () => totalDeductionAmount;

  const getValuationValueAfterDeduction = () => valueAfterDeduction;

  const getValuationMaxLoanAmount = () => maxLoanByAppraisal;

  const getCurrentApplicationCode = () => {
    return (
      storeApplicationCode ||
      String(step2Session?.applicationCode || "") ||
      String(step2Session?.loanApplicationCode || "") ||
      String(step1Identity?.applicationCode || "") ||
      String(step1Identity?.loanApplicationCode || "")
    );
  };

  const buildSaveDraftPayload = (
    values: PreliminaryInfoFormValues,
  ): SaveLoanApplicationDraftPayload => {
    return {
      applicantSnapshot: {
        fullName: values.fullName || "",
        dateOfBirth: parseDisplayDateToApi(values.dateOfBirth) || "",
        gender: normalizeGender(values.gender),
        identifierNumber: values.identityNumber || "",
        phoneNumber: values.phoneNumber || "",
        occupation: values.job || "",
        monthlyIncome: parseMoneyInput(values.monthlyIncome) ?? 0,
      },
      loanRequest: {
        loanPurpose: values.loanPurpose || "",
        requestedAmount: parseMoneyInput(values.desiredLoanAmount) ?? 0,
        requestedTenure: Number(values.term || selectedTerm || 0),
      },
    };
  };

  const saveCurrentStep2ToSession = (values: PreliminaryInfoFormValues) => {
    const recommendationData = loanRecommendationResult?.data;
    const paymentMethod =
      getStringFromUnknownObject(selectedRecommendedProduct, ["paymentMethod"]) ||
      getStringFromUnknownObject(recommendationData, ["paymentMethod"]);
    const firstPaymentDate =
      getStringFromUnknownObject(selectedRecommendedProduct, [
        "firstPaymentDate",
        "firstDueDate",
        "firstPaymentDueDate",
      ]) ||
      getStringFromUnknownObject(recommendationData, [
        "firstPaymentDate",
        "firstDueDate",
        "firstPaymentDueDate",
      ]);
    const monthlyPaymentDay =
      getNumberFromUnknownObject(selectedRecommendedProduct, [
        "monthlyPaymentDay",
      ]) ||
      getNumberFromUnknownObject(recommendationData, ["monthlyPaymentDay"]);
    const processingBranch =
      getStringFromUnknownObject(selectedRecommendedProduct, [
        "processingBranch",
        "branchCode",
        "branchName",
      ]) ||
      getStringFromUnknownObject(recommendationData, [
        "processingBranch",
        "branchCode",
        "branchName",
      ]);

    const nextSessionData = {
      ...values,
      monthlyIncome: getDigitsOnly(values.monthlyIncome),
      desiredLoanAmount: getDigitsOnly(values.desiredLoanAmount),
      selectedDeductionIds,
      selectedTerm,
      selectedProductCode:
        selectedRecommendedProduct?.productCode || selectedProductCode,
      recommendedProductCode:
        recommendationData?.recommendedProductCode ||
        selectedRecommendedProduct?.productCode ||
        "",
      paymentMethod,
      firstPaymentDate,
      monthlyPaymentDay: monthlyPaymentDay > 0 ? String(monthlyPaymentDay) : "",
      processingBranch,
      applicationCode: getCurrentApplicationCode(),
      loanApplicationCode: getCurrentApplicationCode(),
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
        marketPriceResponse.data?.marketValue ||
          getNumberFromUnknownObject(marketPriceResponse, ["marketValue"]) ||
          0,
      );

      if (!marketValueFromApi) {
        throw new Error("API market-price không trả về marketValue hợp lệ.");
      }

      setMarketPriceResult(marketPriceResponse);

      const previewPayload = buildAssetValuationPayload(
        vehicleVariant,
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
              [
                {
                  type: deduction.id,
                  rate: deduction.percent,
                },
              ],
            );

            const response = await assetValuationApi.preview(payload);
            const data = response.data || response;

            const totalDeductionAmountFromApi = getNumberFromUnknownObject(
              data,
              ["totalDeductionAmount"],
            );

            const finalValue = getNumberFromUnknownObject(data, [
              "finalValue",
              "valueAfterDeduction",
            ]);

            const amountFromFinalValue =
              finalValue > 0 ? Math.max(currentMarketValue - finalValue, 0) : 0;

            const amountFromPercent =
              deduction.percent > 0
                ? (currentMarketValue * deduction.percent) / 100
                : 0;

            const amount =
              totalDeductionAmountFromApi ||
              amountFromFinalValue ||
              amountFromPercent;

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

    const requestedLoanAmount = parseMoneyInput(watchedDesiredLoanAmount) ?? 0;

    if (
      !watchedLoanPurpose ||
      !watchedAssetType ||
      !watchedTerm ||
      requestedLoanAmount <= 0 ||
      valueAfterDeduction <= 0
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
      adjustedAssetValue: Number(valueAfterDeduction),
      scoreGrade,
    };

    const signature = JSON.stringify(payload);

    if (signature === loanRecommendationSignatureRef.current) {
      return;
    }

    loanRecommendationTimerRef.current = setTimeout(async () => {
      loanRecommendationSignatureRef.current = signature;

      setIsLoanRecommendationLoading(true);
      setLoanRecommendationError("");

      try {
        const response = await loanProductRecommendationApi.recommend(payload);

        if (response.success === false) {
          throw new Error(
            response.message || "Không lấy được đề xuất gói vay.",
          );
        }

        const products = response.data?.products || [];

        setLoanRecommendationResult(response);
        setLoanRecommendation((response.data || response) as Record<string, unknown>);
        setRecommendedProducts(products);

        const nextSelectedProductCode =
          response.data?.recommendedProductCode ||
          products.find((item) => item.recommended)?.productCode ||
          products[0]?.productCode ||
          "";

        setSelectedProductCode((current) => {
          if (
            current &&
            products.some((item) => item.productCode === current)
          ) {
            return current;
          }

          return nextSelectedProductCode;
        });

        const selectedProduct =
          products.find(
            (product) => product.productCode === nextSelectedProductCode,
          ) ||
          products.find((product) => product.recommended) ||
          products[0];

        setSelectedLoanProduct(selectedProduct || null);
      } catch (error) {
        console.error("Loan product recommendation error:", error);

        setLoanRecommendationResult(null);
        setRecommendedProducts([]);
        setSelectedProductCode("");
        setLoanRecommendationError(
          "Không thể lấy đề xuất gói vay. Vui lòng kiểm tra lại mục đích vay, kỳ hạn, số tiền vay và định giá tài sản.",
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
    scoreGrade,
    watchedLoanPurpose,
    watchedAssetType,
    watchedTerm,
    watchedDesiredLoanAmount,
    valueAfterDeduction,
    setLoanRecommendation,
    setSelectedLoanProduct,
  ]);

  const handleSaveDraft = async () => {
    const values = form.getValues();
    const applicationCode = getCurrentApplicationCode();

    saveCurrentStep2ToSession(values);

    try {
      if (!applicationCode) {
        throw new Error(
          "Thieu applicationCode. Vui long hoan tat man dinh danh truoc.",
        );
      }

      const response = await preliminaryInfoApi.saveDraft(
        applicationCode,
        buildSaveDraftPayload(values),
      );

      if (!response.success || !response.data?.applicationCode) {
        throw new Error(response.message || "Luu nhap that bai.");
      }

      setApplicationCode(response.data.applicationCode);
    } catch (error) {
      console.error("Lưu nháp lỗi:", error);
    }
  };

  const handleSubmit = async (values: PreliminaryInfoFormValues) => {
    setIsSubmitting(true);

    try {
      saveCurrentStep2ToSession(values);
      setCurrentStep(3);
      toast.success("Đã lưu thông tin bước 2 vào phiên làm việc.");

      navigate({
        to: "/loan/customer-asset-detail",
      });
    } catch (error) {
      console.error("Submit step 2 lỗi:", error);
      toast.error("Không thể lưu thông tin sơ bộ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = () => {
    toast.error("Vui lòng kiểm tra trường bắt buộc hoặc dữ liệu sai định dạng.");
  };

  const handleCancel = () => {
    console.log("Huỷ hồ sơ");
  };

  const handleBack = () => {
    navigate({
      to: "/loan/customer-identify",
    });
  };

  void handleSaveDraft;
  void handleCancel;

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
              onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}
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
                    autoFilled={hasAutoFilledCustomerInfo}
                  />

                  <TextInputField
                    form={form}
                    name="identityNumber"
                    label="Số CCCD"
                    placeholder="Nhập số CCCD"
                    className="bg-[#f8fbf8]"
                    autoFilled={hasAutoFilledCustomerInfo}
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
                    autoFilled={hasAutoFilledCustomerInfo}
                    onlyNumber
                    inputMode="numeric"
                    maxLength={11}
                  />

                  <DateOfBirthField
                    form={form}
                    autoFilled={hasAutoFilledCustomerInfo}
                  />

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
                    options={loanTermOptions}
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
                <div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">
                      Kết quả định giá sơ bộ
                    </h3>

                    <p className="mt-1 text-sm text-[#64748b]">
                      Hệ thống tự động tính khi nhập đủ thông tin tài sản.
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl bg-[#eef9ef] p-5">
                      <p className="text-sm text-[#64748b]">
                        Giá trị thị trường
                      </p>

                      <p className="mt-3 text-2xl font-bold text-[#111827]">
                        {isValuationLoading
                          ? "Đang tính..."
                          : formatCurrencyVnd(getValuationMarketValue())}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#fde8ec] p-5">
                      <p className="text-sm text-[#64748b]">Tổng giảm trừ</p>

                      <p className="mt-3 text-2xl font-bold text-[#dc2626]">
                        {isValuationLoading
                          ? "Đang tính..."
                          : formatCurrencyVnd(
                              getValuationTotalDeductionAmount(),
                            )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#e8f8e8] p-5">
                      <p className="text-sm text-[#64748b]">Giá sau giảm trừ</p>

                      <p className="mt-3 text-2xl font-bold text-[#009b3a]">
                        {isValuationLoading
                          ? "Đang tính..."
                          : formatCurrencyVnd(
                              getValuationValueAfterDeduction(),
                            )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#e8f8e8] p-5">
                      <p className="text-sm text-[#64748b]">Khoản vay tối đa</p>

                      <p className="mt-3 text-2xl font-bold text-[#009b3a]">
                        {isValuationLoading
                          ? "Đang tính..."
                          : formatCurrencyVnd(getValuationMaxLoanAmount())}
                      </p>
                    </div>
                  </div>
                </div>

                {valuationError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {valuationError}
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
                  selectedTerm={String(
                    watchedTerm ||
                      loanRecommendationResult?.data?.requestedTermMonths ||
                      selectedTerm ||
                      "",
                  )}
                  isLoading={isLoanRecommendationLoading}
                  error={loanRecommendationError}
                  onSelectProduct={setSelectedProductCode}
                />
              </SectionCard>

              <BottomActions
                isSubmitting={isSubmitting}
                onBack={handleBack}
              />
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
}

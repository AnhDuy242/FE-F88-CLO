import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import {
  Calculator,
  Car,
  DocumentText,
  TickCircle,
} from "iconsax-react";

import AppHeader from "@/components/shared/AppHeader";

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
  AssetValuationPayload,
  AssetValuationResponse,
  AssetValuationResult,
} from "@/features/preliminary-info/types/asset-valuation.type";

export const Route = createFileRoute("/loan/preliminary-info")({
  component: PreliminaryInfoScreen,
});

const CURRENT_STEP = 2;

const deductions: DeductionItem[] = [
  { id: "scratch", label: "Trầy xước", percent: 3 },
  { id: "dent", label: "Móp méo", percent: 5 },
  { id: "repaint", label: "Sơn lại", percent: 4 },
  { id: "missing-document", label: "Thiếu giấy tờ", percent: 8 },
  { id: "repaired", label: "Xe đã sửa chữa", percent: 6 },
  { id: "high-odo", label: "ODO cao (>50,000km)", percent: 7 },
];

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

function mapOcrSexToGender(sex?: string) {
  if (!sex) return "";

  const normalizedSex = sex.trim().toLowerCase();

  if (
    normalizedSex === "nam" ||
    normalizedSex === "male" ||
    normalizedSex === "m"
  ) {
    return "male";
  }

  if (
    normalizedSex === "nữ" ||
    normalizedSex === "nu" ||
    normalizedSex === "female" ||
    normalizedSex === "f"
  ) {
    return "female";
  }

  return "other";
}

function PreliminaryInfoScreen() {
  const navigate = useNavigate();

  const step1Identity = getStep1Identity();
  const step2Session = getStep2PreliminaryInfo();

  const initialGender =
    step2Session?.gender || mapOcrSexToGender(step1Identity?.sex);

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
  const [valuationResult, setValuationResult] =
    useState<AssetValuationResponse | null>(null);

  const valuationRequestSignatureRef = useRef("");
  const valuationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applicationCode =
    sessionStorage.getItem("applicationCode") ||
    sessionStorage.getItem("loanApplicationCode") ||
    "APP-DEMO-001";

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
      monthlyIncome: step2Session?.monthlyIncome || "",
      loanPurpose: step2Session?.loanPurpose || "",
      desiredLoanAmount: step2Session?.desiredLoanAmount || "",
      term: step2Session?.term || "12",

      assetType: step2Session?.assetType || "motorbike",
      plateNumber: step2Session?.plateNumber || "",
      brand: step2Session?.brand || "",
      model: step2Session?.model || "",
      version: step2Session?.version || "",
      manufactureYear: step2Session?.manufactureYear || "",
      color: step2Session?.color || "",
    },
  });

  const [
    watchedAssetType,
    watchedPlateNumber,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedColor,
  ] = useWatch({
    control: form.control,
    name: [
      "assetType",
      "plateNumber",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "color",
    ],
  });

  const marketValue = 50_000_000;

  const totalDeductionPercent = useMemo(() => {
    return deductions
      .filter((item) => selectedDeductionIds.includes(item.id))
      .reduce((total, item) => total + item.percent, 0);
  }, [selectedDeductionIds]);

  const valueAfterDeduction = useMemo(() => {
    return marketValue * (1 - totalDeductionPercent / 100);
  }, [totalDeductionPercent]);

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

  const buildPayload = (
    values: PreliminaryInfoFormValues,
  ): PreliminaryInfoPayload => {
    return {
      ...values,
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
    return deductions
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
    if (!values.plateNumber) missingFields.push("Biển số xe");
    if (!values.brand) missingFields.push("Hãng xe");
    if (!values.model) missingFields.push("Dòng xe");
    if (!values.version) missingFields.push("Phiên bản xe");
    if (!values.manufactureYear) missingFields.push("Năm sản xuất");
    if (!values.color) missingFields.push("Màu xe");

    return missingFields;
  };

  const isAssetValuationReady = () => {
    return getMissingAssetFields().length === 0;
  };

  const buildAssetValuationPayload = (): AssetValuationPayload => {
    const values = form.getValues();

    return {
      assetSnapshot: {
        assetType: values.assetType || "",
        licensePlate: values.plateNumber || "",
        brand: values.brand || "",
        model: values.model || "",
        vehicleVariant: values.version || "",
        manufactureYear: Number(values.manufactureYear || 0),
        vehicleColor: values.color || "",
      },
      deductionItems: buildDeductionItems(),
    };
  };

  const buildAssetValuationSignature = () => {
    const payload = buildAssetValuationPayload();

    return JSON.stringify({
      applicationCode,
      assetSnapshot: payload.assetSnapshot,
      deductionItems: payload.deductionItems
        .slice()
        .sort((a, b) => a.type.localeCompare(b.type)),
    });
  };

  const getValuationData = (): AssetValuationResult | null => {
    if (!valuationResult) {
      return null;
    }

    return valuationResult.data || valuationResult;
  };

  const getValuationMarketValue = () => {
    const data = getValuationData();

    return data?.marketValue || data?.estimatedValue || marketValue;
  };

  const getValuationDeductionRate = () => {
    const data = getValuationData();

    return data?.totalDeductionRate || totalDeductionPercent;
  };

  const getValuationValueAfterDeduction = () => {
    const data = getValuationData();

    return data?.valueAfterDeduction || data?.finalValue || valueAfterDeduction;
  };

  const getValuationMaxLoanAmount = () => {
    const data = getValuationData();

    return data?.maxLoanAmount || maxLoanByAppraisal;
  };

  const getValuationLtv = () => {
    const data = getValuationData();

    return data?.ltvRate || data?.loanToValue || selectedPackage.ltv;
  };

  const handleCalculateAssetValuation = async () => {
    const missingFields = getMissingAssetFields();

    if (missingFields.length > 0) {
      console.log("Auto valuation chưa chạy vì thiếu:", missingFields);

      setValuationResult(null);
      setValuationError("");
      valuationRequestSignatureRef.current = "";
      return;
    }

    if (!applicationCode) {
      setValuationResult(null);
      setValuationError("Không tìm thấy mã hồ sơ vay để định giá tài sản.");
      return;
    }

    const isValidAssetForm = await form.trigger([
      "assetType",
      "plateNumber",
      "brand",
      "model",
      "version",
      "manufactureYear",
      "color",
    ]);

    if (!isValidAssetForm) {
      setValuationResult(null);
      setValuationError(
        "Vui lòng nhập đúng thông tin tài sản trước khi định giá.",
      );
      return;
    }

    const signature = buildAssetValuationSignature();

    if (signature === valuationRequestSignatureRef.current) {
      console.log("Bỏ qua call API định giá vì payload không đổi");
      return;
    }

    valuationRequestSignatureRef.current = signature;

    setIsValuationLoading(true);
    setValuationError("");

    try {
      const payload = buildAssetValuationPayload();

      console.log("Đang gọi API định giá:", {
        applicationCode,
        payload,
      });

      const response = await assetValuationApi.preview(applicationCode, payload);

      console.log("Kết quả API định giá:", response);

      setValuationResult(response);
      setValuationError("");
    } catch (error) {
      console.error("Auto asset valuation error:", error);

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
      console.log("Auto valuation chưa chạy vì thiếu:", missingFields);

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
    watchedPlateNumber,
    watchedBrand,
    watchedModel,
    watchedVersion,
    watchedManufactureYear,
    watchedColor,
    selectedDeductionIds.join("|"),
    applicationCode,
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

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <main className="min-h-screen">
        <AppHeader />

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
                    options={[
                      { label: "Nam", value: "male" },
                      { label: "Nữ", value: "female" },
                      { label: "Khác", value: "other" },
                    ]}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <SelectField
                    form={form}
                    name="job"
                    label="Nghề nghiệp"
                    placeholder="Chọn nghề nghiệp"
                    options={[
                      { label: "Nhân viên văn phòng", value: "employee" },
                      { label: "Kinh doanh tự do", value: "business" },
                      { label: "Tài xế", value: "driver" },
                      { label: "Công nhân", value: "worker" },
                    ]}
                  />

                  <TextInputField
                    form={form}
                    name="monthlyIncome"
                    label="Thu nhập hàng tháng"
                    placeholder="VNĐ"
                    onlyNumber
                    inputMode="numeric"
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                  <SelectField
                    form={form}
                    name="loanPurpose"
                    label="Mục đích vay"
                    placeholder="Chọn mục đích"
                    options={[
                      { label: "Kinh doanh", value: "business" },
                      { label: "Tiêu dùng", value: "consume" },
                      { label: "Sửa chữa xe", value: "repair" },
                      { label: "Khác", value: "other" },
                    ]}
                  />

                  <TextInputField
                    form={form}
                    name="desiredLoanAmount"
                    label="Số tiền mong muốn vay"
                    required
                    placeholder="VNĐ"
                    onlyNumber
                    inputMode="numeric"
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
                    options={[
                      { label: "Xe máy", value: "motorbike" },
                      { label: "Ô tô", value: "car" },
                    ]}
                  />

                  <TextInputField
                    form={form}
                    name="plateNumber"
                    label="Biển số xe"
                    required
                    placeholder="VD: 29A12345"
                    uppercase
                    maxLength={12}
                  />

                  <SelectField
                    form={form}
                    name="brand"
                    label="Hãng xe"
                    placeholder="Chọn hãng"
                    options={[
                      { label: "Honda", value: "honda" },
                      { label: "Yamaha", value: "yamaha" },
                      { label: "Suzuki", value: "suzuki" },
                      { label: "VinFast", value: "vinfast" },
                    ]}
                  />

                  <SelectField
                    form={form}
                    name="model"
                    label="Dòng xe"
                    placeholder="Chọn hãng trước"
                    disabled={!form.watch("brand")}
                    options={[
                      { label: "Wave", value: "wave" },
                      { label: "Vision", value: "vision" },
                      { label: "Air Blade", value: "airblade" },
                    ]}
                  />

                  <SelectField
                    form={form}
                    name="version"
                    label="Phiên bản xe"
                    placeholder="Chọn phiên bản"
                    options={[
                      { label: "Tiêu chuẩn", value: "standard" },
                      { label: "Cao cấp", value: "premium" },
                      { label: "Đặc biệt", value: "special" },
                    ]}
                  />

                  <SelectField
                    form={form}
                    name="manufactureYear"
                    label="Năm sản xuất"
                    placeholder="Chọn năm"
                    options={[
                      { label: "2026", value: "2026" },
                      { label: "2025", value: "2025" },
                      { label: "2024", value: "2024" },
                      { label: "2023", value: "2023" },
                    ]}
                  />

                  <SelectField
                    form={form}
                    name="color"
                    label="Màu xe"
                    placeholder="Chọn màu"
                    options={[
                      { label: "Đen", value: "black" },
                      { label: "Trắng", value: "white" },
                      { label: "Đỏ", value: "red" },
                      { label: "Xanh", value: "blue" },
                    ]}
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
                  deductions={deductions}
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

                {valuationResult && !valuationError && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    Đã tự động tính định giá sơ bộ thành công.
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
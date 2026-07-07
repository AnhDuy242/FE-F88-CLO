import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { parseMoneyInput } from "@/lib/currency";
import { parseDisplayDateToApi } from "@/lib/date";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";
import { SectionCard } from "@/features/preliminary-info/components/SectionCard";
import { customerIdentifyApi } from "@/features/customer-identify/api/customer-identify.api";
import { preliminaryInfoApi } from "@/features/preliminary-info/api/preliminary-info.api";
import { customerAssetDetailApi } from "@/features/customer-asset-detail/api/customer-asset-detail.api";
import { assetValuationApi } from "@/features/preliminary-info/api/asset-valuation.api";
import { loanProductRecommendationApi } from "@/features/preliminary-info/api/loan-product-recommendation.api";
import {
  useLoanOnboardingStore,
  type AssetDataState,
  type CustomerAssetDetailState,
  type ReferencePersonState,
  type Step1CustomerIdentifyState,
  type Step2PreliminaryInfoState,
  type UploadedDocumentMeta,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import { LOAN_APPLICATION_DRAFT_STEPS } from "@/features/loan-onboarding/api/loan-application-draft.api";
import { useDraftStepAutosave } from "@/features/loan-onboarding/hooks/use-draft-step-autosave";

export const Route = createFileRoute("/loan/upload-documents")({
  component: UploadDocumentsScreen,
});

const CURRENT_STEP = 4;
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

type UploadSlot = {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
};

type UploadGroup = {
  id: string;
  title: string;
  maxFiles: number;
  slots?: UploadSlot[];
};

type LocalDocumentFile = UploadedDocumentMeta & {
  file: File;
  previewUrl: string;
};

type PreviewFileKind = "image" | "pdf" | "video" | "other";

const uploadGroups: UploadGroup[] = [
  {
    id: "cccd",
    title: "CCCD",
    maxFiles: 2,
    slots: [
      { id: "cccd-front", label: "CCCD mặt trước", required: true },
      { id: "cccd-back", label: "CCCD mặt sau", required: true },
    ],
  },
  {
    id: "vehicle-registration",
    title: "Cà vẹt xe",
    maxFiles: 2,
    slots: [
      { id: "vehicle-registration-front", label: "Cà vẹt mặt trước", required: true },
      { id: "vehicle-registration-back", label: "Cà vẹt mặt sau", required: true },
    ],
  },
  {
    id: "asset-photos",
    title: "Ảnh tài sản",
    maxFiles: 7,
    slots: [
      { id: "asset-front", label: "Ảnh xe - Góc trước", required: true },
      { id: "asset-back", label: "Ảnh xe - Góc sau", required: true },
      { id: "asset-left", label: "Ảnh xe - Góc trái", required: true },
      { id: "asset-right", label: "Ảnh xe - Góc phải", required: true },
      { id: "frame-number", label: "Ảnh số khung" },
      { id: "engine-number", label: "Ảnh số máy" },
      { id: "odo", label: "Ảnh đồng hồ ODO" },
    ],
  },
  {
    id: "customer-portrait",
    title: "Chân dung Khách hàng",
    maxFiles: 3,
    slots: [
      { id: "portrait", label: "Ảnh chân dung khách hàng", required: true },
      { id: "portrait-with-cccd", label: "Ảnh chân dung cầm CCCD" },
      {
        id: "portrait-video",
        label: "Video chân dung Khách hàng",
        required: true,
        accept: "video/mp4,video/webm,video/quicktime",
      },
    ],
  },
  {
    id: "other-documents",
    title: "Chứng từ khác",
    maxFiles: 4,
    slots: [
      { id: "income-proof", label: "Chứng minh thu nhập" },
      { id: "residence-proof", label: "Sổ hộ khẩu / Giấy tạm trú" },
      { id: "signed-contract", label: "Hợp đồng có chữ ký KH" },
      { id: "reference-verification", label: "Phiếu xác minh người tham chiếu" },
    ],
  },
];
function getStringFromRecord(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return "";

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function normalizeAssetType(value?: string): "MOTORBIKE" | "CAR" {
  const normalizedValue = (value || "").trim().toUpperCase();

  if (normalizedValue === "CAR" || normalizedValue === "OTO") return "CAR";

  return "MOTORBIKE";
}

function normalizeGender(value?: string) {
  const normalizedValue = (value || "").trim().toUpperCase();

  if (normalizedValue === "NAM" || normalizedValue === "MALE") return "MALE";
  if (normalizedValue === "NU" || normalizedValue === "NỮ" || normalizedValue === "FEMALE") {
    return "FEMALE";
  }

  return normalizedValue;
}

function normalizeApiDate(value?: string) {
  const trimmedValue = (value || "").trim();

  return parseDisplayDateToApi(trimmedValue) || trimmedValue;
}

function validateUploadFile(file: File) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return "File upload chỉ hỗ trợ JPG, PNG, WEBP, PDF hoặc video MP4/WEBM/MOV.";
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return "Dung lượng file tối đa là 10MB.";
  }

  return "";
}

function getPreviewFileKind(type?: string, name?: string): PreviewFileKind {
  const normalizedType = (type || "").toLowerCase();
  const normalizedName = (name || "").toLowerCase();

  if (normalizedType.startsWith("image/")) return "image";
  if (normalizedType === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }
  if (normalizedType.startsWith("video/")) return "video";

  return "other";
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "Khong ro dung luong";

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function revokePreviewUrl(file?: LocalDocumentFile | null) {
  if (file?.previewUrl) {
    URL.revokeObjectURL(file.previewUrl);
  }
}

function getCompleteReferencePersons(references: ReferencePersonState[]) {
  return references.filter(
    (item) => item.fullName.trim() && item.relationshipType.trim() && item.phoneNumber.trim(),
  );
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") return message;
  }

  return "Không thể gửi hồ sơ phê duyệt.";
}

function buildDocumentMeta(file: File, groupId: string, documentType: string, required: boolean): LocalDocumentFile {
  return {
    id: `${groupId}-${documentType}-${file.name}-${file.lastModified}`,
    groupId,
    documentType,
    required,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

function hasRequiredStepData(
  step1: Step1CustomerIdentifyState,
  step2: Step2PreliminaryInfoState,
  step3: CustomerAssetDetailState | null,
) {
  return Boolean(
    step1.fullName &&
      step1.identityNumber &&
      step1.phoneNumber &&
      step2.loanPurpose &&
      step2.desiredLoanAmount &&
      step2.term &&
      step3?.fullName &&
      step3.assetData.vehicleVariant,
  );
}

function UploadDocumentsScreen() {
  const navigate = useNavigate();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const documentsByGroupRef = useRef<Record<string, LocalDocumentFile[]>>({});

  const {
    applicationCode,
    draftCode,
    selectedCustomer,
    step1CustomerIdentify,
    step2PreliminaryInfo,
    customerAssetDetailData,
    assetData,
    references,
    selectedLoanProduct,
    loanRecommendation,
    setApplicationCode,
    setCurrentStep,
    setUploadedDocuments,
  } = useLoanOnboardingStore();

  const [documentsByGroup, setDocumentsByGroup] = useState<Record<string, LocalDocumentFile[]>>({});
  const [previewFile, setPreviewFile] = useState<LocalDocumentFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    documentsByGroupRef.current = documentsByGroup;
  }, [documentsByGroup]);

  const step3Data = customerAssetDetailData;
  const finalAssetData = step3Data?.assetData || assetData;
  const finalReferences = step3Data?.references?.length ? step3Data.references : references;

  const totalUploadedDocuments = useMemo(
    () => Object.values(documentsByGroup).reduce((total, items) => total + items.length, 0),
    [documentsByGroup],
  );

  const uploadedDocumentMetadata = useMemo<UploadedDocumentMeta[]>(() => {
    return Object.values(documentsByGroup)
      .flat()
      .map(({ file: _file, previewUrl: _previewUrl, ...meta }) => meta);
  }, [documentsByGroup]);

  useEffect(() => {
    return () => {
      Object.values(documentsByGroupRef.current)
        .flat()
        .forEach(revokePreviewUrl);
    };
  }, []);

  useEffect(() => {
    setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUploadedDocuments(uploadedDocumentMetadata);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [setUploadedDocuments, uploadedDocumentMetadata]);

  const selectedProductCode =
    step3Data?.selectedLoanProductCode ||
    getStringFromRecord(selectedLoanProduct, ["productCode"]) ||
    getStringFromRecord(loanRecommendation, ["recommendedProductCode"]);

  const loanApplicationContext = {
    applicationChannel:
      getStringFromRecord(step2PreliminaryInfo, ["applicationChannel"]) ||
      getStringFromRecord(step1CustomerIdentify, ["applicationChannel"]) ||
      getStringFromRecord(selectedCustomer, ["applicationChannel"]),
    branchCode:
      getStringFromRecord(step2PreliminaryInfo, ["branchCode"]) ||
      getStringFromRecord(step1CustomerIdentify, ["branchCode"]) ||
      getStringFromRecord(selectedCustomer, ["branchCode"]),
    staffCode:
      getStringFromRecord(step2PreliminaryInfo, ["staffCode"]) ||
      getStringFromRecord(step1CustomerIdentify, ["staffCode"]) ||
      getStringFromRecord(selectedCustomer, ["staffCode"]),
  };

  const step4Autosave = useDraftStepAutosave({
    draftCode,
    stepCode: LOAN_APPLICATION_DRAFT_STEPS.uploadComplete,
    data: {
      uploadedDocuments: uploadedDocumentMetadata,
      checklist: uploadGroups.map((group) => ({
        groupId: group.id,
        title: group.title,
        uploadedCount: (documentsByGroup[group.id] || []).length,
        maxFiles: group.maxFiles,
        requiredSlots: (group.slots || [])
          .filter((slot) => slot.required)
          .map((slot) => ({
            documentCode: slot.id,
            label: slot.label,
            uploaded: (documentsByGroup[group.id] || []).some(
              (file) => file.documentType === slot.id,
            ),
          })),
      })),
    },
    enabled: Boolean(draftCode),
    debounceMs: 1000,
  });

  const handleBack = () => {
    setCurrentStep(3);
    navigate({ to: "/loan/customer-asset-detail" });
  };

  const handleFilesChange = (group: UploadGroup, slot?: UploadSlot) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      const invalidFileMessage = files
        .map(validateUploadFile)
        .find((message) => Boolean(message));

      if (invalidFileMessage) {
        toast.error(invalidFileMessage);
        event.target.value = "";
        return;
      }

      const currentItems = documentsByGroup[group.id] || [];
      const currentItemsForLimit = slot
        ? currentItems.filter((item) => item.documentType !== slot.id)
        : currentItems;
      const remainingSlots = Math.max(group.maxFiles - currentItemsForLimit.length, 0);

      if (remainingSlots <= 0) {
        toast.error(`Nhóm ${group.title} đã đạt tối đa ${group.maxFiles} file.`);
        event.target.value = "";
        return;
      }

      setDocumentsByGroup((current) => {
        const latestItems = current[group.id] || [];
        const replacedItems = slot
          ? latestItems.filter((item) => item.documentType === slot.id)
          : [];
        const baseItems = slot
          ? latestItems.filter((item) => item.documentType !== slot.id)
          : latestItems;
        const latestRemainingSlots = Math.max(group.maxFiles - baseItems.length, 0);
        const nextFiles = slot ? files.slice(0, 1) : files;
        const nextItems = nextFiles
          .slice(0, latestRemainingSlots)
          .map((file) =>
            buildDocumentMeta(
              file,
              group.id,
              slot?.id || `${group.id}-${baseItems.length + 1}`,
              Boolean(slot?.required),
            ),
          );

        if (
          previewFile &&
          replacedItems.some((item) => item.id === previewFile.id)
        ) {
          setPreviewFile(null);
        }

        replacedItems.forEach(revokePreviewUrl);

        return {
          ...current,
          [group.id]: [...baseItems, ...nextItems],
        };
      });
      toast.success("Đã thêm file chứng từ vào phiên làm việc.");

      event.target.value = "";
    };
  };

  const removeDocument = (groupId: string, documentId: string) => {
    setDocumentsByGroup((current) => {
      const removedDocument = (current[groupId] || []).find(
        (item) => item.id === documentId,
      );

      revokePreviewUrl(removedDocument);

      if (previewFile?.id === documentId) {
        setPreviewFile(null);
      }

      return {
        ...current,
        [groupId]: (current[groupId] || []).filter((item) => item.id !== documentId),
      };
    });
  };

  const validateBeforeSubmit = () => {
    const errors: string[] = [];

    if (!hasRequiredStepData(step1CustomerIdentify, step2PreliminaryInfo, step3Data)) {
      errors.push("Thiếu dữ liệu từ bước 1, 2 hoặc 3. Vui lòng quay lại kiểm tra.");
    }

    if (getCompleteReferencePersons(finalReferences).length < 3) {
      errors.push("Cần tối thiểu 3 người tham chiếu hợp lệ.");
    }

    if (
      !applicationCode &&
      (!loanApplicationContext.applicationChannel ||
        !loanApplicationContext.branchCode ||
        !loanApplicationContext.staffCode)
    ) {
      errors.push(
        "Thiếu kênh tiếp nhận, mã chi nhánh hoặc mã nhân viên để tạo hồ sơ vay nháp.",
      );
    }

    if (!finalAssetData?.vehicleVariant) {
      errors.push("Thiếu biến thể xe để lưu tài sản.");
    }

    if (!selectedProductCode) {
      errors.push("Chưa chọn gói vay cuối cùng.");
    }

    const missingRequiredSlots = uploadGroups.flatMap((group) => {
      return (group.slots || [])
        .filter((slot) => slot.required)
        .filter((slot) => {
          return !(documentsByGroup[group.id] || []).some(
            (file) => file.documentType === slot.id,
          );
        })
        .map((slot) => slot.label);
    });

    if (missingRequiredSlots.length > 0) {
      errors.push(`Thiếu chứng từ bắt buộc: ${missingRequiredSlots.join(", ")}.`);
    }

    return errors;
  };

  const ensureCustomerCode = async () => {
    const existingCustomerCode =
      getStringFromRecord(selectedCustomer, ["customerCode"]) ||
      step1CustomerIdentify.customerCode;

    if (existingCustomerCode) return existingCustomerCode;

    const response = await customerIdentifyApi.createCustomer({
      fullName: step1CustomerIdentify.fullName,
      identifierNumber: step1CustomerIdentify.identityNumber,
      phoneNumber: step1CustomerIdentify.phoneNumber,
      dateOfBirth: normalizeApiDate(step1CustomerIdentify.dateOfBirth),
    });

    if (!response.success || !response.data?.customerCode) {
      throw new Error(response.message || "Không thể tạo khách hàng trước khi gửi phê duyệt.");
    }

    return response.data.customerCode;
  };

  const ensureApplicationCode = async (customerCode: string) => {
    if (applicationCode) return applicationCode;

    const response = await preliminaryInfoApi.createLoanApplicationDraft({
      customerCode,
      ...loanApplicationContext,
    });

    if (!response.success || !response.data?.applicationCode) {
      throw new Error(response.message || "Không thể tạo hồ sơ vay nháp.");
    }

    setApplicationCode(response.data.applicationCode);

    return response.data.applicationCode;
  };

  const saveFinalApplicationData = async (nextApplicationCode: string, nextAssetData: AssetDataState) => {
    await preliminaryInfoApi.saveDraft(nextApplicationCode, {
      applicantSnapshot: {
        fullName: step2PreliminaryInfo.fullName || step1CustomerIdentify.fullName,
        dateOfBirth: normalizeApiDate(step2PreliminaryInfo.dateOfBirth || step1CustomerIdentify.dateOfBirth),
        gender: normalizeGender(step2PreliminaryInfo.gender || step1CustomerIdentify.gender),
        identifierNumber: step2PreliminaryInfo.identityNumber || step1CustomerIdentify.identityNumber,
        phoneNumber: step2PreliminaryInfo.phoneNumber || step1CustomerIdentify.phoneNumber,
        occupation: step2PreliminaryInfo.job,
        monthlyIncome: parseMoneyInput(step2PreliminaryInfo.monthlyIncome) ?? 0,
      },
      loanRequest: {
        loanPurpose: step2PreliminaryInfo.loanPurpose,
        requestedAmount: parseMoneyInput(step2PreliminaryInfo.desiredLoanAmount) ?? 0,
        requestedTenure: Number(step2PreliminaryInfo.term || step2PreliminaryInfo.selectedTerm || 0),
      },
    });

    if (!step3Data) {
      throw new Error("Thiếu dữ liệu bước 3.");
    }

    await customerAssetDetailApi.saveCustomerDetail(nextApplicationCode, {
      gender: normalizeGender(step3Data.gender),
      email: step3Data.email || "",
      maritalStatus: step3Data.maritalStatus,
      occupationCode: step3Data.occupationCode,
      incomeSourceCode: step3Data.incomeSourceCode,
      monthlyIncomeAmount: parseMoneyInput(step3Data.monthlyIncomeAmount) ?? 0,
      disbursementBankCode: step3Data.disbursementBankCode,
      disbursementAccountNumber: step3Data.disbursementAccountNumber,
      disbursementAccountName: step3Data.disbursementAccountName,
      workplaceName: step3Data.workplaceName || "",
      permanentAddress: step3Data.permanentAddress,
      currentAddress: step3Data.currentAddress,
    });

    await customerAssetDetailApi.saveReferencePersons(nextApplicationCode, {
      referencePersons: getCompleteReferencePersons(finalReferences).map((item) => ({
        fullName: item.fullName,
        phoneNumber: item.phoneNumber,
        relationshipType: item.relationshipType,
        address: item.address || "",
        note: item.note || "",
      })),
    });

    await customerAssetDetailApi.saveAssetSnapshot(nextApplicationCode, {
      assetType: normalizeAssetType(nextAssetData.assetType),
      licensePlate: nextAssetData.licensePlate,
      brand: nextAssetData.brand,
      model: nextAssetData.model,
      vehicleVariant: nextAssetData.vehicleVariant,
      manufactureYear: Number(nextAssetData.manufactureYear),
      vehicleColor: nextAssetData.vehicleColor,
    });

    await customerAssetDetailApi.saveAssetLegalInfo(nextApplicationCode, {
      frameNumber: nextAssetData.frameNumber,
      engineNumber: nextAssetData.engineNumber,
    });

    if (nextAssetData.registrationNumber && nextAssetData.registrationIssueDate) {
      await customerAssetDetailApi.saveVehicleRegistration(nextApplicationCode, {
        registrationNumber: nextAssetData.registrationNumber,
        registrationIssueDate: normalizeApiDate(nextAssetData.registrationIssueDate),
      });
    }

    await assetValuationApi.save(nextApplicationCode, {
      assetSnapshot: {
        assetType: normalizeAssetType(nextAssetData.assetType),
        brand: nextAssetData.brand,
        model: nextAssetData.model,
        vehicleVariant: nextAssetData.vehicleVariant,
        manufactureYear: Number(nextAssetData.manufactureYear),
        vehicleColor: nextAssetData.vehicleColor,
      },
      deductionItems: nextAssetData.selectedDeductionItems.map((item) => ({
        type: item.type,
        rate: item.rate,
      })),
    });

    await loanProductRecommendationApi.selectFinalOffer(nextApplicationCode, {
      productCode: selectedProductCode,
      requestedAmount: parseMoneyInput(step2PreliminaryInfo.desiredLoanAmount) ?? 0,
      loanTermMonths: Number(step2PreliminaryInfo.term || step2PreliminaryInfo.selectedTerm || 0),
    });
  };

  const handleSubmitForApproval = async () => {
    setSubmitError("");
    setSubmitMessage("");

    const validationErrors = validateBeforeSubmit();

    if (validationErrors.length > 0) {
      const message = validationErrors.join(" ");

      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (!finalAssetData) {
      const message = "Thiếu dữ liệu tài sản.";

      setSubmitError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      setUploadedDocuments(uploadedDocumentMetadata);

      const customerCode = await ensureCustomerCode();
      const nextApplicationCode = await ensureApplicationCode(customerCode);

      await saveFinalApplicationData(nextApplicationCode, finalAssetData);

      const response = await customerAssetDetailApi.submitForApproval(nextApplicationCode);

      if (response.success === false) {
        throw new Error(response.message || "Gửi hồ sơ phê duyệt thất bại.");
      }

      setCurrentStep(4);
      const message =
        totalUploadedDocuments > 0
          ? "Hồ sơ đã gửi phê duyệt. BE chưa có API upload chứng từ nên file đã chọn chưa được gửi lên server."
          : response.data?.message || response.message || "Hồ sơ đã gửi phê duyệt.";

      setSubmitMessage(message);
      toast.success(message);
    } catch (error) {
      console.error("Submit final approval error:", error);

      if (error && typeof error === "object" && "raw" in error) {
        console.error("Submit final approval response.data:", (error as { raw?: unknown }).raw);
      }

      const message = getApiErrorMessage(error);

      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewFileKind = getPreviewFileKind(previewFile?.type, previewFile?.name);

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <main className="min-h-screen">
        <section className="px-8 py-6">
          <CustomerIdentifyBreadcrumb currentStep={CURRENT_STEP} />

          <div className="overflow-x-auto pb-2">
            <LoanOnboardingStepper currentStep={CURRENT_STEP} />
          </div>
          {draftCode && (
            <p className="mb-3 text-xs font-medium text-[#15803d]">
              {step4Autosave.status === "saving" && "Dang luu nhap..."}
              {step4Autosave.status === "saved" && "Da luu nhap"}
              {step4Autosave.status === "error" && "Luu nhap that bai"}
            </p>
          )}

          <div className="space-y-5">
            <SectionCard
              title="Upload chứng từ"
              icon={<Upload className="h-6 w-6 text-[#009b3a]" />}
              iconClassName="bg-[#e9f8ee]"
            >
              <Accordion
                type="multiple"
                defaultValue={uploadGroups.map((group) => group.id)}
                className="space-y-4"
              >
                {uploadGroups.map((group) => {
                  const groupFiles = documentsByGroup[group.id] || [];

                  return (
                    <AccordionItem
                      key={group.id}
                      value={group.id}
                      className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] px-5 transition-all duration-200 hover:border-[#b7e4c7] hover:shadow-sm"
                    >
                      <AccordionTrigger className="transition-colors hover:no-underline">
                        <div className="flex w-full items-center justify-between pr-4">
                          <div>
                            <p className="text-base font-bold text-[#111827]">{group.title}</p>
                            <p className="mt-1 text-sm text-[#64748b]">
                              {groupFiles.length}/{group.maxFiles}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="space-y-4">
                          {(group.slots || [{ id: `${group.id}-generic`, label: group.title }]).map((slot) => {
                            const inputKey = `${group.id}-${slot.id}`;
                            const slotFiles = groupFiles.filter(
                              (file) => file.documentType === slot.id,
                            );

                            return (
                              <div
                                key={slot.id}
                                className="rounded-xl border border-dashed border-[#c8d8cc] bg-white p-4 transition-colors duration-200 hover:border-[#009b3a]"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="font-semibold text-[#111827]">
                                      {slot.label} {slot.required && <span className="text-red-500">*</span>}
                                    </p>
                                    <p className="mt-1 text-sm text-[#64748b]">
                                      {slot.accept?.startsWith("video")
                                        ? "MP4, WEBM hoặc MOV. File chỉ giữ tạm trên màn này."
                                        : "JPG, PNG, WEBP hoặc PDF. File chỉ giữ tạm trên màn này."}
                                    </p>
                                  </div>

                                  <input
                                    ref={(element) => {
                                      fileInputRefs.current[inputKey] = element;
                                    }}
                                    type="file"
                                    accept={slot.accept || "image/*,.pdf"}
                                    multiple={!group.slots}
                                    className="hidden"
                                    onChange={handleFilesChange(group, slot)}
                                  />

                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={groupFiles.length >= group.maxFiles && slotFiles.length === 0}
                                    onClick={() => fileInputRefs.current[inputKey]?.click()}
                                    className="h-11 rounded-xl border-[#009b3a] px-5 font-bold text-[#009b3a] transition-colors hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {slotFiles.length > 0 ? "Thay thế" : "Tải lên"}
                                  </Button>
                                </div>

                                {slotFiles.length > 0 && (
                                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {slotFiles.map((file) => {
                                      const kind = getPreviewFileKind(file.type, file.name);

                                      return (
                                        <div
                                          key={file.id}
                                          className="flex gap-3 rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] p-3"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => setPreviewFile(file)}
                                            className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dbe5dd] bg-white text-[#009b3a] transition-colors hover:border-[#009b3a]"
                                            aria-label={`Xem ${file.name}`}
                                          >
                                            {kind === "image" && (
                                              <img
                                                src={file.previewUrl}
                                                alt={file.name}
                                                className="h-full w-full object-cover"
                                              />
                                            )}
                                            {kind === "video" && (
                                              <video
                                                src={file.previewUrl}
                                                className="h-full w-full object-cover"
                                                muted
                                                preload="metadata"
                                              />
                                            )}
                                            {kind === "pdf" && (
                                              <div className="flex flex-col items-center gap-1 text-xs font-bold">
                                                <FileText className="h-7 w-7" />
                                                PDF
                                              </div>
                                            )}
                                            {kind === "other" && (
                                              <FileText className="h-7 w-7" />
                                            )}
                                          </button>

                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-[#111827]">
                                              {file.name}
                                            </p>
                                            <p className="mt-1 text-xs text-[#64748b]">
                                              {formatFileSize(file.size)}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-[#15803d]">
                                              Đã chọn trong phiên làm việc
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setPreviewFile(file)}
                                                className="h-8 rounded-lg border-[#009b3a] px-3 text-xs font-bold text-[#009b3a] hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                                              >
                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                Xem chi tiết
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => removeDocument(group.id, file.id)}
                                                className="h-8 rounded-lg px-3 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                                              >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                Xóa
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </SectionCard>

            <SectionCard
              title="Kết quả eKYC — Đối chiếu khuôn mặt"
              icon={<CheckCircle2 className="h-6 w-6 text-[#009b3a]" />}
              iconClassName="bg-[#e9f8ee]"
            >
              <div className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-[#8a6d00]" />
                  <div>
                    <p className="font-bold text-[#111827]">Chưa có API eKYC/face match để đối chiếu tự động.</p>
                    <div className="mt-3 space-y-2 text-sm text-[#64748b]">
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Đối chiếu khuôn mặt CCCD với ảnh chân dung</span>
                        <span className="font-semibold text-[#8a6d00]">Chưa có dữ liệu</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Liveness Detection</span>
                        <span className="font-semibold text-[#8a6d00]">Chưa có dữ liệu</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#64748b]">
                      Màn hình giữ vị trí kết quả để ghép BE sau. Không hiển thị kết quả nghiệp vụ giả.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {submitError}
              </div>
            )}

            {submitMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {submitMessage}
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
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitForApproval}
                className="h-11 rounded-xl bg-[#009b3a] px-8 font-bold text-white transition-colors hover:bg-[#008232] disabled:opacity-70"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi đi để phê duyệt"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[94vw] max-w-6xl overflow-hidden rounded-2xl border-[#dbe5dd] bg-white p-0">
          {previewFile && (
            <div className="flex max-h-[92vh] flex-col">
              <DialogHeader className="border-b border-[#dbe5dd] px-6 py-4">
                <DialogTitle className="truncate pr-8 text-lg font-bold text-[#111827]">
                  {previewFile.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#64748b]">
                  {formatFileSize(previewFile.size)} • Đã chọn trong phiên làm việc
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f6faf5] p-4">
                {previewFileKind === "image" && (
                  <img
                    src={previewFile.previewUrl}
                    alt={previewFile.name}
                    className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-sm"
                  />
                )}

                {previewFileKind === "video" && (
                  <video
                    src={previewFile.previewUrl}
                    controls
                    className="max-h-[74vh] max-w-full rounded-xl bg-black shadow-sm"
                  />
                )}

                {previewFileKind === "pdf" && (
                  <object
                    data={previewFile.previewUrl}
                    type="application/pdf"
                    className="h-[74vh] w-full rounded-xl border border-[#dbe5dd] bg-white"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[#64748b]">
                      <FileText className="h-12 w-12 text-[#009b3a]" />
                      <p className="font-semibold text-[#111827]">
                        Trình duyệt không hiển thị được PDF này.
                      </p>
                      <a
                        href={previewFile.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#009b3a] underline-offset-4 hover:underline"
                      >
                        Mở PDF trong tab mới
                      </a>
                    </div>
                  </object>
                )}

                {previewFileKind === "other" && (
                  <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-[#dbe5dd] bg-white text-center text-[#64748b]">
                    <FileText className="h-14 w-14 text-[#009b3a]" />
                    <p className="font-semibold text-[#111827]">
                      Chưa hỗ trợ xem trước loại file này.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";
import { SectionCard } from "@/features/preliminary-info/components/SectionCard";
import {
  useLoanOnboardingStore,
  type CustomerAssetDetailState,
  type ReferencePersonState,
  type Step1CustomerIdentifyState,
  type Step2PreliminaryInfoState,
  type UploadedDocumentMeta,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import {
  loanApplicationDraftApi,
  type UploadLoanApplicationDraftDocument,
} from "@/features/loan-onboarding/api/loan-application-draft.api";

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

const SUBMIT_DOCUMENT_CODE_BY_SLOT_ID: Record<string, string> = {
  "cccd-front": "CITIZEN_ID_FRONT",
  "cccd-back": "CITIZEN_ID_BACK",
  "vehicle-registration-front": "VEHICLE_REGISTRATION_FRONT",
  "vehicle-registration-back": "VEHICLE_REGISTRATION_BACK",
  "asset-front": "ASSET_FRONT_IMAGE",
  "asset-back": "ASSET_BACK_IMAGE",
  "asset-left": "ASSET_LEFT_IMAGE",
  "asset-right": "ASSET_RIGHT_IMAGE",
  "frame-number": "ASSET_FRAME_NUMBER_IMAGE",
  "engine-number": "ASSET_ENGINE_NUMBER_IMAGE",
  odo: "ASSET_ODOMETER_IMAGE",
  portrait: "BORROWER_PORTRAIT_IMAGE",
  "portrait-with-cccd": "BORROWER_HOLDING_CITIZEN_ID_IMAGE",
  "portrait-video": "BORROWER_PORTRAIT_VIDEO",
  "income-proof": "INCOME_PROOF",
  "residence-proof": "RESIDENCE_PROOF_DOCUMENT",
  "signed-contract": "CUSTOMER_SIGNED_CONTRACT",
  "reference-verification": "REFERENCE_VERIFICATION_FORM",
};

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

function getGroupSlots(group: UploadGroup) {
  return group.slots || [{ id: `${group.id}-generic`, label: group.title }];
}

function getAllUploadSlots() {
  return uploadGroups.flatMap((group) =>
    getGroupSlots(group).map((slot) => ({
      group,
      slot,
    })),
  );
}

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

function toSubmitDocumentCode(documentType: string) {
  return SUBMIT_DOCUMENT_CODE_BY_SLOT_ID[documentType] || documentType.trim().toUpperCase();
}

function buildSubmitDocuments(
  documentsByGroup: Record<string, LocalDocumentFile[]>,
): UploadLoanApplicationDraftDocument[] {
  return Object.values(documentsByGroup)
    .flat()
    .map((document) => ({
      documentTypeCode: toSubmitDocumentCode(document.documentType),
      file: document.file,
      fileName: document.name,
    }));
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
    draftCode,
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [missingDocumentIds, setMissingDocumentIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    documentsByGroupRef.current = documentsByGroup;
  }, [documentsByGroup]);

  const step3Data = customerAssetDetailData;
  const finalAssetData = step3Data?.assetData || assetData;
  const finalReferences = step3Data?.references?.length ? step3Data.references : references;

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

  const missingUploadSlots = useMemo(() => {
    return getAllUploadSlots().filter(({ group, slot }) => {
      return !(documentsByGroup[group.id] || []).some(
        (file) => file.documentType === slot.id,
      );
    });
  }, [documentsByGroup]);

  const isUploadComplete = missingUploadSlots.length === 0;

  const getMissingDocumentsMessage = (labels: string[]) => {
    return `Vui lòng upload đủ chứng từ còn thiếu: ${labels.join(", ")}.`;
  };

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
              true,
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
      if (slot) {
        setMissingDocumentIds((current) =>
          current.filter((documentId) => documentId !== slot.id),
        );
      }
      setSubmitError("");
      setSubmitMessage("");
      toast.success("Đã tải chứng từ.");

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

    setSubmitMessage("");
  };

  const validateRequiredDocuments = () => {
    const missingLabels = missingUploadSlots.map(({ slot }) => slot.label);
    const missingIds = missingUploadSlots.map(({ slot }) => slot.id);

    setMissingDocumentIds(missingIds);

    if (missingLabels.length > 0) {
      const message = getMissingDocumentsMessage(missingLabels);

      setSubmitError(message);
      toast.error(message);
      return false;
    }

    setSubmitError("");
    return true;
  };

  const handleCompleteDocuments = () => {
    setSubmitMessage("");

    if (!validateRequiredDocuments()) return;

    setIsConfirmOpen(true);
  };

  const validateBeforeSubmit = () => {
    const errors: string[] = [];

    if (!hasRequiredStepData(step1CustomerIdentify, step2PreliminaryInfo, step3Data)) {
      errors.push("Thiếu dữ liệu từ bước 1, 2 hoặc 3. Vui lòng quay lại kiểm tra.");
    }

    if (getCompleteReferencePersons(finalReferences).length < 3) {
      errors.push("Cần tối thiểu 3 người tham chiếu hợp lệ.");
    }

    if (!draftCode) {
      errors.push("Thiếu mã hồ sơ vay nháp. Vui lòng quay lại bước 1 để tạo hồ sơ.");
    }

    if (!finalAssetData?.vehicleVariant) {
      errors.push("Thiếu biến thể xe để lưu tài sản.");
    }

    if (!selectedProductCode) {
      errors.push("Chưa chọn gói vay cuối cùng.");
    }

    const missingRequiredSlots = missingUploadSlots.map(({ slot }) => slot.label);

    if (missingRequiredSlots.length > 0) {
      errors.push(getMissingDocumentsMessage(missingRequiredSlots));
    }

    return errors;
  };

  const handleSubmitForApproval = async () => {
    setSubmitError("");
    setSubmitMessage("");

    const validationErrors = validateBeforeSubmit();

    if (validationErrors.length > 0) {
      const message = validationErrors.join(" ");

      setMissingDocumentIds(missingUploadSlots.map(({ slot }) => slot.id));
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

      const response = await loanApplicationDraftApi.submit(draftCode, {
        documents: buildSubmitDocuments(documentsByGroup),
      });

      if (response.success === false) {
        throw new Error(response.message || "Gửi hồ sơ phê duyệt thất bại.");
      }

      if (response.data?.applicationCode) {
        setApplicationCode(response.data.applicationCode);
      }
      setCurrentStep(4);

      setIsConfirmOpen(false);
      setSubmitMessage("Gửi hồ sơ thành công");
      toast.success("Gửi hồ sơ thành công");
      navigate({ to: "/home" });
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
                  const groupSlots = getGroupSlots(group);

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
                              {groupFiles.length}/{groupSlots.length}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="space-y-3">
                          {groupSlots.map((slot) => {
                            const inputKey = `${group.id}-${slot.id}`;
                            const slotFiles = groupFiles.filter(
                              (file) => file.documentType === slot.id,
                            );
                            const uploadedFile = slotFiles[0];
                            const previewKind = getPreviewFileKind(
                              uploadedFile?.type,
                              uploadedFile?.name,
                            );
                            const isMissing = missingDocumentIds.includes(slot.id);

                            return (
                              <div
                                key={slot.id}
                                className={`rounded-xl border bg-white px-4 py-3 transition-colors duration-200 ${
                                  isMissing
                                    ? "border-red-300 bg-red-50/40"
                                    : "border-dashed border-[#c8d8cc] hover:border-[#009b3a]"
                                }`}
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-[#111827]">
                                      {slot.label} <span className="text-red-500">*</span>
                                    </p>
                                    {uploadedFile ? (
                                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748b]">
                                        <span className="max-w-full truncate font-medium text-[#111827]">
                                          {uploadedFile.name}
                                        </span>
                                        <span>{uploadedFile.type || "Không rõ loại"}</span>
                                        <span>{formatFileSize(uploadedFile.size)}</span>
                                        <span className="font-semibold text-[#15803d]">Đã tải</span>
                                      </div>
                                    ) : (
                                      <p className="mt-1 text-sm text-[#64748b]">
                                        {slot.accept?.startsWith("video")
                                          ? "MP4, WEBM hoặc MOV. File sẽ được gửi khi phê duyệt."
                                          : "JPG, PNG, WEBP hoặc PDF. File sẽ được gửi khi phê duyệt."}
                                      </p>
                                    )}
                                    {isMissing && (
                                      <p className="mt-2 text-sm font-medium text-red-600">
                                        Vui lòng upload chứng từ này.
                                      </p>
                                    )}
                                  </div>

                                  <input
                                    ref={(element) => {
                                      fileInputRefs.current[inputKey] = element;
                                    }}
                                    type="file"
                                    accept={slot.accept || "image/*,.pdf"}
                                    className="hidden"
                                    onChange={handleFilesChange(group, slot)}
                                  />

                                  <div className="flex shrink-0 items-center gap-2">
                                    {uploadedFile && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFile(uploadedFile)}
                                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dbe5dd] bg-[#f8fbf8] text-[#009b3a] transition-colors hover:border-[#009b3a]"
                                        aria-label={`Xem ${uploadedFile.name}`}
                                      >
                                        {previewKind === "image" && (
                                          <img
                                            src={uploadedFile.previewUrl}
                                            alt={uploadedFile.name}
                                            className="h-full w-full object-cover"
                                          />
                                        )}
                                        {previewKind === "video" && (
                                          <video
                                            src={uploadedFile.previewUrl}
                                            className="h-full w-full object-cover"
                                            muted
                                            preload="metadata"
                                          />
                                        )}
                                        {previewKind === "pdf" && (
                                          <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold">
                                            <FileText className="h-5 w-5" />
                                            PDF
                                          </div>
                                        )}
                                        {previewKind === "other" && (
                                          <FileText className="h-5 w-5" />
                                        )}
                                      </button>
                                    )}

                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={groupFiles.length >= group.maxFiles && slotFiles.length === 0}
                                      onClick={() => fileInputRefs.current[inputKey]?.click()}
                                      className="h-10 rounded-xl border-[#009b3a] px-4 font-bold text-[#009b3a] transition-colors hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      {uploadedFile ? "Thay thế" : "Tải lên"}
                                    </Button>

                                    {uploadedFile && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeDocument(group.id, uploadedFile.id)}
                                        className="h-10 w-10 rounded-lg p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        aria-label={`Xóa ${uploadedFile.name}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
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
              title="Kết quả eKYC - Đối chiếu khuôn mặt"
              icon={
                isUploadComplete ? (
                  <CheckCircle2 className="h-6 w-6 text-[#009b3a]" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-[#8a6d00]" />
                )
              }
              iconClassName={isUploadComplete ? "bg-[#e9f8ee]" : "bg-[#fff7db]"}
            >
              <div className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] p-5">
                <div className="flex items-start gap-3">
                  {isUploadComplete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#009b3a]" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-[#8a6d00]" />
                  )}
                  <div className="w-full">
                    <p className="font-bold text-[#111827]">
                      {isUploadComplete
                        ? "Hồ sơ đã đủ điều kiện đối chiếu."
                        : "Vui lòng upload đủ hồ sơ để đối chiếu."}
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-[#64748b]">
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Face match</span>
                        <span
                          className={
                            isUploadComplete
                              ? "font-semibold text-[#15803d]"
                              : "font-semibold text-[#8a6d00]"
                          }
                        >
                          {isUploadComplete ? "94% PASSED" : "Cần upload đủ hồ sơ"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Liveness</span>
                        <span
                          className={
                            isUploadComplete
                              ? "font-semibold text-[#15803d]"
                              : "font-semibold text-[#8a6d00]"
                          }
                        >
                          {isUploadComplete ? "97% PASSED" : "Cần upload đủ hồ sơ"}
                        </span>
                      </div>
                    </div>
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
                onClick={handleCompleteDocuments}
                className="h-11 rounded-xl bg-[#009b3a] px-8 font-bold text-white transition-colors hover:bg-[#008232] disabled:opacity-70"
              >
                {isSubmitting ? "Đang gửi..." : "Hoàn tất hồ sơ"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="w-[92vw] max-w-md rounded-2xl border-[#dbe5dd] bg-white p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-[#111827]">
              Bạn có muốn chỉnh sửa gì thêm không?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Xác nhận gửi hồ sơ đi phê duyệt.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-3 sm:justify-center sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsConfirmOpen(false)}
              className="h-11 min-w-32 rounded-xl border-[#dbe5dd] px-6 font-bold text-[#111827] hover:bg-[#f6faf5]"
            >
              Chỉnh sửa
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitForApproval}
              className="h-11 min-w-40 rounded-xl bg-[#009b3a] px-6 font-bold text-white transition-colors hover:bg-[#008232] disabled:opacity-70"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đi phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-lg font-bold text-[#111827]">
                      {previewFile.name}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-[#64748b]">
                      {formatFileSize(previewFile.size)} - Đã tải
                    </DialogDescription>
                  </div>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 shrink-0 rounded-lg border-[#dbe5dd] px-4 text-sm font-bold text-[#111827] hover:bg-[#f6faf5]"
                    >
                      Đóng
                    </Button>
                  </DialogClose>
                </div>
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

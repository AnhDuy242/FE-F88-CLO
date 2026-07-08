import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderOpen,
  Loader2,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";
import { SectionCard } from "@/features/preliminary-info/components/SectionCard";
import {
  useLoanOnboardingStore,
  type UploadedDocumentMeta,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import {
  loanApplicationDraftApi,
  type SubmitLoanApplicationDraftDocument,
} from "@/features/loan-onboarding/api/loan-application-draft.api";

export const Route = createFileRoute("/loan/upload-documents")({
  component: UploadDocumentsScreen,
});

const CURRENT_STEP = 4;
const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];
const EKYC_REQUIRED_DOCUMENT_CODES = [
  "CITIZEN_ID_FRONT",
  "CITIZEN_ID_BACK",
  "CUSTOMER_PORTRAIT",
  "CUSTOMER_PORTRAIT_VIDEO",
] as const;

type UploadRequirementItem = {
  documentCode: string;
  documentName: string;
  groupCode: string;
  required: boolean;
  allowedExtensions: string[];
  maxSizeMb: number;
};

type UploadRequirementGroup = {
  groupCode: string;
  groupName: string;
  requiredCount: number;
  totalCount: number;
  documents: UploadRequirementItem[];
};

type UploadedDocumentState = DraftDocumentUploadResult & {
  id: string;
  documentCode: string;
  documentName: string;
  groupCode: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  localPreviewUrl?: string;
};

type PreviewFileKind = "image" | "pdf" | "video" | "other";

const SUBMIT_DOCUMENT_CODE_BY_SLOT_ID: Record<string, string> = {
  "cccd-front": "CITIZEN_ID_FRONT",
  "cccd-back": "CITIZEN_ID_BACK",
  "vehicle-registration-front": "VEHICLE_REGISTRATION_FRONT",
  "vehicle-registration-back": "VEHICLE_REGISTRATION_BACK",
  "asset-front": "ASSET_FRONT",
  "asset-back": "ASSET_REAR",
  "asset-left": "ASSET_LEFT",
  "asset-right": "ASSET_RIGHT",
  "frame-number": "ASSET_FRAME_NUMBER",
  "engine-number": "ASSET_ENGINE_NUMBER",
  odo: "ASSET_ODO",
  portrait: "CUSTOMER_PORTRAIT",
  "portrait-with-cccd": "BORROWER_HOLDING_CITIZEN_ID_IMAGE",
  "portrait-video": "CUSTOMER_PORTRAIT_VIDEO",
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

function validateUploadFile(file: File, document: UploadRequirementItem) {
  const extension = getFileExtension(file.name);

  if (!extension || !document.allowedExtensions.includes(extension)) {
    return `Định dạng file không hợp lệ. Chỉ hỗ trợ: ${document.allowedExtensions.join(", ")}.`;
  }

  const maxSizeBytes = document.maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `Dung lượng file tối đa là ${document.maxSizeMb}MB.`;
  }

  return "";
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "Không rõ dung lượng";

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
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

function isLocalFileSystemPath(url?: string) {
  if (!url) return false;

  return /^[a-zA-Z]:[\\/]/.test(url) || url.startsWith("/tmp/") || url.startsWith("\\");
}

function getBrowserPreviewUrl(file: UploadedDocumentState) {
  const apiUrl = file.previewUrl || file.fileUrl || file.downloadUrl;

  if (apiUrl && !isLocalFileSystemPath(apiUrl)) return apiUrl;

  return file.localPreviewUrl || apiUrl || "";
}

function revokeLocalPreviewUrl(file?: UploadedDocumentState | null) {
  if (file?.localPreviewUrl) {
    URL.revokeObjectURL(file.localPreviewUrl);
  }
}

function toUploadedDocumentState(
  result: DraftDocumentUploadResult | undefined,
  file: File,
  document: UploadRequirementItem,
): UploadedDocumentState {
  const documentCode = normalizeDocumentCode(result?.documentCode || document.documentCode);
  const uploadedAt = result?.uploadedAt || new Date().toISOString();

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
): SubmitLoanApplicationDraftDocument[] {
  return Object.values(documentsByGroup)
    .flat()
    .map((document) => ({
      documentTypeCode: toSubmitDocumentCode(document.documentType),
      fileUrl: document.previewUrl,
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
  const uploadedByCodeRef = useRef<Record<string, UploadedDocumentState>>({});

  const {
    draftCode,
    setCurrentStep,
    setUploadedDocuments,
  } = useLoanOnboardingStore();

  const [requirementGroups, setRequirementGroups] = useState<UploadRequirementGroup[]>([]);
  const [uploadedByCode, setUploadedByCode] = useState<Record<string, UploadedDocumentState>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingCode, setUploadingCode] = useState("");
  const [previewFile, setPreviewFile] = useState<UploadedDocumentState | null>(null);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [requirementsError, setRequirementsError] = useState("");
  const [isDocumentsCompleted, setIsDocumentsCompleted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [openGroupCodes, setOpenGroupCodes] = useState<string[]>([]);

  useEffect(() => {
    uploadedByCodeRef.current = uploadedByCode;
  }, [uploadedByCode]);

  useEffect(() => {
    setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  useEffect(() => {
    return () => {
      Object.values(uploadedByCodeRef.current).forEach(revokeLocalPreviewUrl);
    };
  }, []);

  useEffect(() => {
    const uploadedDocumentMetadata: UploadedDocumentMeta[] = Object.values(uploadedByCode).map(
      (document) => ({
        id: document.id,
        groupId: document.groupCode,
        documentType: document.documentCode,
        required:
          requirementGroups
            .flatMap((group) => group.documents)
            .find((item) => item.documentCode === document.documentCode)?.required || false,
        name: document.fileName,
        size: document.size,
        type: document.contentType,
        uploadedAt: document.uploadedAt,
      }),
    );

    setUploadedDocuments(uploadedDocumentMetadata);
  }, [requirementGroups, setUploadedDocuments, uploadedByCode]);

  useEffect(() => {
    if (!draftCode) {
      setRequirementsError("Thiếu mã hồ sơ vay nháp. Vui lòng quay lại bước trước.");
      setRequirementGroups([]);
      return;
    }

    let ignore = false;

    async function loadRequirements() {
      setIsLoadingRequirements(true);
      setRequirementsError("");

      try {
        const response = await loanApplicationDraftApi.getDocumentRequirements(draftCode);

        if (response.success === false) {
          throw new Error(response.message || "Không lấy được danh mục chứng từ.");
        }

        if (!ignore) {
          const nextGroups = normalizeRequirementGroups(response.data);

          setRequirementGroups(nextGroups);
          setOpenGroupCodes(nextGroups.map((group) => group.groupCode));
        }
      } catch (error) {
        const message = getApiErrorMessage(error);

        if (!ignore) {
          setRequirementsError(message);
          toast.error(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingRequirements(false);
        }
      }
    }

    void loadRequirements();

    return () => {
      ignore = true;
    };
  }, [draftCode]);

  const requiredDocuments = useMemo(() => {
    return requirementGroups.flatMap((group) => group.documents).filter((document) => document.required);
  }, [requirementGroups]);

  const missingRequiredDocuments = useMemo(() => {
    return requiredDocuments.filter((document) => !uploadedByCode[document.documentCode]);
  }, [requiredDocuments, uploadedByCode]);

  useEffect(() => {
    if (missingRequiredDocuments.length > 0) {
      setIsDocumentsCompleted(false);
    }
  }, [missingRequiredDocuments.length]);

  const isEkycReady = EKYC_REQUIRED_DOCUMENT_CODES.every((documentCode) =>
    Boolean(uploadedByCode[documentCode]),
  );

  const handleBack = () => {
    setCurrentStep(3);
    navigate({ to: "/loan/customer-asset-detail" });
  };

  const updateUploadedDocument = (document: UploadedDocumentState) => {
    setUploadedByCode((current) => {
      const previousDocument = current[document.documentCode];

      revokeLocalPreviewUrl(previousDocument);

      if (previewFile?.documentCode === document.documentCode) {
        setPreviewFile(document);
      }

      return {
        ...current,
        [document.documentCode]: document,
      };
    });
  };

  const handleFileChange = (document: UploadRequirementItem) => {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      const invalidMessage = validateUploadFile(file, document);

      if (invalidMessage) {
        setFieldErrors((current) => ({
          ...current,
          [document.documentCode]: invalidMessage,
        }));
        toast.error(invalidMessage);
        event.target.value = "";
        return;
      }

      if (!draftCode) {
        const message = "Thiếu mã hồ sơ vay nháp. Vui lòng quay lại bước trước.";

        setFieldErrors((current) => ({
          ...current,
          [document.documentCode]: message,
        }));
        toast.error(message);
        event.target.value = "";
        return;
      }

      setUploadingCode(document.documentCode);
      setFieldErrors((current) => ({
        ...current,
        [document.documentCode]: "",
      }));

      try {
        const response = await loanApplicationDraftApi.uploadDocument(
          draftCode,
          document.documentCode,
          file,
        );

        if (response.success === false) {
          throw new Error(response.message || "Upload chứng từ thất bại.");
        }

        updateUploadedDocument(toUploadedDocumentState(response.data, file, document));
        setSubmitMessage("");
        toast.success(response.message || "Upload chứng từ thành công.");
      } catch (error) {
        const message = getApiErrorMessage(error);

        setFieldErrors((current) => ({
          ...current,
          [document.documentCode]: message,
        }));
        toast.error(message);
      } finally {
        setUploadingCode("");
        event.target.value = "";
      }
    };
  };

  const removeDocument = (documentCode: string) => {
    setUploadedByCode((current) => {
      const removedDocument = current[documentCode];
      const nextDocuments = { ...current };

      delete nextDocuments[documentCode];
      revokeLocalPreviewUrl(removedDocument);

      if (previewFile?.documentCode === documentCode) {
        setPreviewFile(null);
      }

      return nextDocuments;
    });

    const requirement = requirementGroups
      .flatMap((group) => group.documents)
      .find((document) => document.documentCode === documentCode);

    if (requirement?.required) {
      setFieldErrors((current) => ({
        ...current,
        [documentCode]: "Vui lòng upload chứng từ bắt buộc này.",
      }));
    }
  };

  const validateBeforeComplete = () => {
    const nextFieldErrors: Record<string, string> = {};

    missingRequiredDocuments.forEach((document) => {
      nextFieldErrors[document.documentCode] = "Vui lòng upload chứng từ bắt buộc này.";
    });

    setFieldErrors((current) => ({
      ...current,
      ...nextFieldErrors,
    }));

    if (missingRequiredDocuments.length > 0) {
      const message = `Thiếu chứng từ bắt buộc: ${missingRequiredDocuments
        .map((document) => document.documentName)
        .join(", ")}.`;

      toast.error(message);
      return false;
    }

    return true;
  };

  const handleCompleteDocuments = () => {
    setSubmitMessage("");

    if (!validateBeforeComplete()) return;

    setIsDocumentsCompleted(true);
    const message = "Hồ sơ đã đủ chứng từ bắt buộc.";

    setSubmitMessage(message);
    toast.success(message);
  };

  const handleSubmitForApproval = () => {
    toast.info("Chưa có API gửi phê duyệt cuối cho flow mới của màn 4.");
  };

  const previewFileKind = getPreviewFileKind(previewFile?.contentType, previewFile?.fileName);
  const previewUrl = previewFile ? getBrowserPreviewUrl(previewFile) : "";

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
              {isLoadingRequirements && (
                <div className="flex items-center gap-2 rounded-xl border border-[#dbe5dd] bg-white px-4 py-3 text-sm font-medium text-[#64748b]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#009b3a]" />
                  Đang tải danh mục chứng từ...
                </div>
              )}

              {requirementsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {requirementsError}
                </div>
              )}

              {!isLoadingRequirements && !requirementsError && (
                <Accordion
                  type="multiple"
                  value={openGroupCodes}
                  onValueChange={setOpenGroupCodes}
                  className="space-y-4"
                >
                  {requirementGroups.map((group) => {
                    const uploadedCount = group.documents.filter(
                      (document) => uploadedByCode[document.documentCode],
                    ).length;

                    return (
                      <AccordionItem
                        key={group.groupCode}
                        value={group.groupCode}
                        className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] px-5 transition-all duration-200 hover:border-[#b7e4c7] hover:shadow-sm"
                      >
                        <AccordionTrigger className="transition-colors hover:no-underline">
                          <div className="flex w-full items-center justify-between pr-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f8ee] text-[#009b3a]">
                                <FolderOpen className="h-5 w-5" />
                              </span>
                              <div className="text-left">
                                <p className="text-base font-bold text-[#111827]">{group.groupName}</p>
                                <p className="mt-0.5 text-sm text-[#64748b]">
                                  {uploadedCount}/{group.totalCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          <div className="space-y-3">
                            {group.documents.map((document) => {
                              const inputKey = `${group.groupCode}-${document.documentCode}`;
                              const uploadedDocument = uploadedByCode[document.documentCode];
                              const fieldError = fieldErrors[document.documentCode];
                              const isUploading = uploadingCode === document.documentCode;
                              const kind = getPreviewFileKind(
                                uploadedDocument?.contentType,
                                uploadedDocument?.fileName,
                              );
                              const documentPreviewUrl = uploadedDocument
                                ? getBrowserPreviewUrl(uploadedDocument)
                                : "";

                              return (
                                <div
                                  key={document.documentCode}
                                  className="rounded-xl border border-dashed border-[#c8d8cc] bg-white px-4 py-3 transition-colors duration-200 hover:border-[#009b3a]"
                                >
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-[#111827]">
                                        {document.documentName}{" "}
                                        {document.required && <span className="text-red-500">*</span>}
                                      </p>
                                      {uploadedDocument ? (
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748b]">
                                          <span className="max-w-full truncate font-medium text-[#111827]">
                                            {uploadedDocument.fileName}
                                          </span>
                                          <span>{uploadedDocument.contentType || "Không rõ loại"}</span>
                                          <span>{formatFileSize(uploadedDocument.size)}</span>
                                          <span className="font-semibold text-[#15803d]">Đã tải</span>
                                        </div>
                                      ) : (
                                        <p className="mt-1 text-sm text-[#64748b]">
                                          {document.allowedExtensions.join(", ").toUpperCase()}.
                                          Dung lượng tối đa {document.maxSizeMb}MB.
                                        </p>
                                      )}
                                      {fieldError && (
                                        <p className="mt-2 text-sm font-medium text-red-600">
                                          {fieldError}
                                        </p>
                                      )}
                                    </div>

                                    <input
                                      ref={(element) => {
                                        fileInputRefs.current[inputKey] = element;
                                      }}
                                      type="file"
                                      accept={getAcceptValue(document)}
                                      className="hidden"
                                      onChange={handleFileChange(document)}
                                    />

                                    <div className="flex shrink-0 items-center gap-2">
                                      {uploadedDocument && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewFile(uploadedDocument)}
                                          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dbe5dd] bg-[#f8fbf8] text-[#009b3a] transition-colors hover:border-[#009b3a]"
                                          aria-label={`Xem ${uploadedDocument.fileName}`}
                                        >
                                          {kind === "image" && documentPreviewUrl && (
                                            <img
                                              src={documentPreviewUrl}
                                              alt={uploadedDocument.fileName}
                                              className="h-full w-full object-cover"
                                            />
                                          )}
                                          {kind === "video" && documentPreviewUrl && (
                                            <video
                                              src={documentPreviewUrl}
                                              className="h-full w-full object-cover"
                                              muted
                                              preload="metadata"
                                            />
                                          )}
                                          {kind === "pdf" && (
                                            <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold">
                                              <FileText className="h-5 w-5" />
                                              PDF
                                            </div>
                                          )}
                                          {kind === "other" && <FileText className="h-5 w-5" />}
                                        </button>
                                      )}

                                      <Button
                                        type="button"
                                        variant="outline"
                                        disabled={Boolean(uploadingCode)}
                                        onClick={() => fileInputRefs.current[inputKey]?.click()}
                                        className="h-10 rounded-xl border-[#009b3a] px-4 font-bold text-[#009b3a] transition-colors hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                                      >
                                        {isUploading ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        {uploadedDocument ? "Thay thế" : "Tải lên"}
                                      </Button>

                                      {uploadedDocument && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() => removeDocument(document.documentCode)}
                                          className="h-10 w-10 rounded-lg p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                          aria-label={`Xóa ${uploadedDocument.fileName}`}
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
              )}
            </SectionCard>

            <SectionCard
              title="Kết quả eKYC - Đối chiếu khuôn mặt"
              icon={
                isEkycReady ? (
                  <CheckCircle2 className="h-6 w-6 text-[#009b3a]" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-[#8a6d00]" />
                )
              }
              iconClassName={isEkycReady ? "bg-[#e9f8ee]" : "bg-[#fff7db]"}
            >
              <div className="rounded-xl border border-[#dbe5dd] bg-[#fbfffc] p-5">
                <div className="flex items-start gap-3">
                  {isEkycReady ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#009b3a]" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-[#8a6d00]" />
                  )}
                  <div className="w-full">
                    <p className="font-bold text-[#111827]">Kết quả eKYC</p>
                    <div className="mt-3 space-y-2 text-sm text-[#64748b]">
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Face match</span>
                        <span
                          className={
                            isEkycReady
                              ? "font-semibold text-[#15803d]"
                              : "font-semibold text-[#8a6d00]"
                          }
                        >
                          {isEkycReady ? "94% PASSED" : "Chưa có dữ liệu"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                        <span>Liveness</span>
                        <span
                          className={
                            isEkycReady
                              ? "font-semibold text-[#15803d]"
                              : "font-semibold text-[#8a6d00]"
                          }
                        >
                          {isEkycReady ? "97% PASSED" : "Chưa có dữ liệu"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

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

              {isDocumentsCompleted ? (
                <Button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="h-11 rounded-xl bg-[#009b3a] px-8 font-bold text-white transition-colors hover:bg-[#008232]"
                >
                  Gửi đi phê duyệt
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isLoadingRequirements || Boolean(uploadingCode)}
                  onClick={handleCompleteDocuments}
                  className="h-11 rounded-xl bg-[#009b3a] px-8 font-bold text-white transition-colors hover:bg-[#008232] disabled:opacity-70"
                >
                  Hoàn tất hồ sơ
                </Button>
              )}
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
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-lg font-bold text-[#111827]">
                      {previewFile.fileName}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-[#64748b]">
                      {formatFileSize(previewFile.size)} - Đã upload
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
                {previewFileKind === "image" && previewUrl && (
                  <img
                    src={previewUrl}
                    alt={previewFile.fileName}
                    className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-sm"
                  />
                )}

                {previewFileKind === "video" && previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-[74vh] max-w-full rounded-xl bg-black shadow-sm"
                  />
                )}

                {previewFileKind === "pdf" && previewUrl && (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="h-[74vh] w-full rounded-xl border border-[#dbe5dd] bg-white"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[#64748b]">
                      <FileText className="h-12 w-12 text-[#009b3a]" />
                      <p className="font-semibold text-[#111827]">
                        Trình duyệt không hiển thị được PDF này.
                      </p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#009b3a] underline-offset-4 hover:underline"
                      >
                        Mở PDF trong tab mới
                      </a>
                    </div>
                  </object>
                )}

                {(!previewUrl || previewFileKind === "other") && (
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

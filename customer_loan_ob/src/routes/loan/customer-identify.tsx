import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { DocumentText, Gallery, Refresh, Trash, User } from "iconsax-react";

import { AppDatePicker } from "@/components/shared/AppDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  normalizeDateForDisplay,
  parseDisplayDateToApi,
} from "@/lib/date";

import { CCCDUploadBox } from "@/features/customer-identify/components/CCCDUploadBox";
import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";

import {
  customerIdentifySchema,
  type CustomerIdentifyFormValues,
} from "@/features/customer-identify/schemas/customer-identify.schema";

import { customerIdentifyApi } from "@/features/customer-identify/api/customer-identify.api";
import {
  LOAN_APPLICATION_DRAFT_STEPS,
  loanApplicationDraftApi,
} from "@/features/loan-onboarding/api/loan-application-draft.api";
import { useDraftStepAutosave } from "@/features/loan-onboarding/hooks/use-draft-step-autosave";

import {
  useLoanOnboardingStore,
  type Step1CustomerIdentifyState,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";

import type {
  CustomerIdentifyResponse,
  CustomerOcrData,
  UploadedImage,
  UploadSide,
} from "@/features/customer-identify/types/customer-identify.type";

export const Route = createFileRoute("/loan/customer-identify")({
  component: CustomerIdentifyScreen,
});

const CURRENT_STEP = 1;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

type OcrStatus = {
  type: "success" | "error";
  message: string;
};

function convertDateToApiFormat(value?: string) {
  return parseDisplayDateToApi(value) || "";
}

function buildImageMeta(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

function revokeImagePreview(image: UploadedImage | null) {
  if (image?.previewUrl) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

function getMatchedCustomerId(response: CustomerIdentifyResponse) {
  return response.data?.matchedCustomer?.customerId || response.customerId || "";
}

function getMatchedCustomerCode(response: CustomerIdentifyResponse) {
  return (
    response.data?.customerCode ||
    response.data?.matchedCustomer?.customerCode ||
    ""
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function isBlockedLookup(response: CustomerIdentifyResponse | null) {
  return response?.data?.onboardingPermission === "BLOCKED";
}

function canCreateCustomerFromLookup(response: CustomerIdentifyResponse | null) {
  return (
    response?.data?.found === false &&
    response.data.lookupStatus === "NOT_FOUND" &&
    response.data.onboardingPermission === "NEED_CREATE_CUSTOMER"
  );
}

function getLookupBlockMessage(response: CustomerIdentifyResponse | null) {
  const reasonCode = response?.data?.reasonCode;

  if (reasonCode === "CUSTOMER_IDENTITY_NUMBER_MISMATCH") {
    return "Số giấy tờ đã tồn tại trong hệ thống nhưng thông tin chưa khớp. Vui lòng tra cứu lại khách hàng.";
  }

  if (reasonCode === "CUSTOMER_PHONE_NUMBER_MISMATCH") {
    return "Số điện thoại đã tồn tại trong hệ thống nhưng thông tin chưa khớp. Vui lòng tra cứu lại khách hàng.";
  }

  if (reasonCode === "CUSTOMER_IDENTITY_INFO_MISMATCH") {
    return "Thông tin định danh đã tồn tại trong hệ thống nhưng họ tên hoặc ngày sinh chưa khớp. Vui lòng kiểm tra lại.";
  }

  if (reasonCode) {
    return `Không thể tạo hồ sơ mới cho khách hàng này (${reasonCode}).`;
  }

  return "Không thể tạo hồ sơ mới cho khách hàng này. Vui lòng kiểm tra lại kết quả tra cứu.";
}

function getStringFromUnknown(source: unknown, keys: string[]) {
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

function buildCustomerSnapshot(
  values: CustomerIdentifyFormValues,
  response: CustomerIdentifyResponse | null,
  step1CustomerIdentify: Step1CustomerIdentifyState,
) {
  const matchedCustomer = response?.data?.matchedCustomer || null;
  const ocrData = step1CustomerIdentify.ocrData;

  const fullName =
    getStringFromUnknown(matchedCustomer, ["fullName", "customerName"]) ||
    values.fullName.trim() ||
    getStringFromUnknown(ocrData, ["fullName", "customerName"]) ||
    step1CustomerIdentify.fullName;

  const dateOfBirth =
    convertDateToApiFormat(
      getStringFromUnknown(matchedCustomer, ["dateOfBirth", "birthDate"]),
    ) ||
    convertDateToApiFormat(values.dateOfBirth) ||
    convertDateToApiFormat(
      getStringFromUnknown(ocrData, ["dateOfBirth", "dateOfBirthFormatted"]),
    ) ||
    step1CustomerIdentify.dateOfBirth;

  const phoneNumber =
    getStringFromUnknown(matchedCustomer, ["phoneNumber"]) ||
    values.phoneNumber.trim() ||
    getStringFromUnknown(ocrData, ["phoneNumber"]) ||
    step1CustomerIdentify.phoneNumber;

  const identityNumber =
    getStringFromUnknown(matchedCustomer, [
      "identifierNumber",
      "identityNumber",
      "cccdNumber",
    ]) ||
    values.identityNumber.trim() ||
    getStringFromUnknown(ocrData, [
      "identityNumber",
      "identifierNumber",
      "cccdNumber",
    ]) ||
    step1CustomerIdentify.identityNumber;

  const customerCode =
    response?.data?.customerCode ||
    getStringFromUnknown(matchedCustomer, ["customerCode"]) ||
    step1CustomerIdentify.customerCode;

  const customerId =
    getStringFromUnknown(matchedCustomer, ["customerId", "id"]) ||
    response?.customerId ||
    step1CustomerIdentify.customerId;

  const customerStatus =
    response?.data?.customerStatus ||
    response?.data?.customerState ||
    getStringFromUnknown(matchedCustomer, ["customerStatus", "status"]) ||
    step1CustomerIdentify.customerStatus ||
    response?.data?.lookupStatus ||
    "";

  const gender =
    getStringFromUnknown(matchedCustomer, ["gender", "sex"]) ||
    getStringFromUnknown(ocrData, ["gender", "sex"]) ||
    step1CustomerIdentify.gender ||
    step1CustomerIdentify.sex;

  const address =
    getStringFromUnknown(matchedCustomer, [
      "address",
      "permanentAddress",
      "currentAddress",
    ]) ||
    getStringFromUnknown(ocrData, ["address", "permanentAddress"]) ||
    String(step1CustomerIdentify.address || "");

  const issueDate =
    getStringFromUnknown(ocrData, ["issueDate", "issuedDate"]) ||
    step1CustomerIdentify.issueDate;

  const issuePlace =
    getStringFromUnknown(ocrData, ["issuePlace", "issuedPlace"]) ||
    String(step1CustomerIdentify.issuePlace || "");

  return {
    fullName,
    dateOfBirth,
    phoneNumber,
    identityNumber,
    cccdNumber: identityNumber,
    gender,
    address,
    customerId,
    customerCode,
    customerStatus,
    issueDate,
    issuePlace,
    lookupStatus: response?.data?.lookupStatus || step1CustomerIdentify.lookupStatus,
    onboardingPermission:
      response?.data?.onboardingPermission ||
      step1CustomerIdentify.onboardingPermission,
  };
}

function CustomerIdentifyScreen() {
  const navigate = useNavigate();

  const {
    step1CustomerIdentify,
    setCurrentStep,
    setDraftInfo,
    setStep1CustomerIdentify,
    setStep2PreliminaryInfo,
    setSelectedCustomer,
    clearStep1CustomerIdentify,
    draftCode,
  } = useLoanOnboardingStore();

  const [frontCccd, setFrontCccd] = useState<UploadedImage | null>(null);
  const [backCccd, setBackCccd] = useState<UploadedImage | null>(null);

  const [uploadError, setUploadError] = useState("");

  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(
    step1CustomerIdentify.ocrSuccessMessage
      ? {
          type: "success",
          message: step1CustomerIdentify.ocrSuccessMessage,
        }
      : step1CustomerIdentify.ocrErrorMessage
        ? {
            type: "error",
            message: step1CustomerIdentify.ocrErrorMessage,
          }
        : null,
  );

  const [isCheckingOcr, setIsCheckingOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<CustomerIdentifyResponse | null>(
    step1CustomerIdentify.customerCheckResult,
  );
  const [pendingOcrData, setPendingOcrData] =
    useState<Record<string, unknown> | null>(step1CustomerIdentify.ocrData);
  const hasPendingOcrFill = Boolean(pendingOcrData);

  const form = useForm<CustomerIdentifyFormValues>({
    resolver: zodResolver(customerIdentifySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fullName: step1CustomerIdentify.fullName || "",
      dateOfBirth: normalizeDateForDisplay(step1CustomerIdentify.dateOfBirth),
      phoneNumber: step1CustomerIdentify.phoneNumber || "",
      identityNumber: step1CustomerIdentify.identityNumber || "",
    },
  });

  const watchedIdentifyValues = useWatch({
    control: form.control,
  }) as Partial<CustomerIdentifyFormValues>;

  const identifyAutosaveValues = useMemo<CustomerIdentifyFormValues>(() => {
    return {
      ...form.getValues(),
      ...watchedIdentifyValues,
    };
  }, [form, watchedIdentifyValues]);

  useEffect(() => {
    setStep1CustomerIdentify({
      fullName: identifyAutosaveValues.fullName || "",
      dateOfBirth: convertDateToApiFormat(identifyAutosaveValues.dateOfBirth),
      phoneNumber: identifyAutosaveValues.phoneNumber || "",
      identityNumber: identifyAutosaveValues.identityNumber || "",
      cccdNumber: identifyAutosaveValues.identityNumber || "",
      customerCheckResult: result,
      ocrData: pendingOcrData || step1CustomerIdentify.ocrData,
    });
  }, [
    identifyAutosaveValues,
    pendingOcrData,
    result,
    setStep1CustomerIdentify,
    step1CustomerIdentify.ocrData,
  ]);

  const step1AutosavePayload = useMemo(() => {
    const dateOfBirth = convertDateToApiFormat(
      identifyAutosaveValues.dateOfBirth,
    );

    return {
      fullName: identifyAutosaveValues.fullName?.trim() || "",
      dateOfBirth,
      phoneNumber: identifyAutosaveValues.phoneNumber?.trim() || "",
      identityNumber: identifyAutosaveValues.identityNumber?.trim() || "",
      cccdNumber: identifyAutosaveValues.identityNumber?.trim() || "",
      customerId: step1CustomerIdentify.customerId || "",
      customerCode: step1CustomerIdentify.customerCode || "",
      customerStatus: step1CustomerIdentify.customerStatus || "",
      lookupStatus:
        result?.data?.lookupStatus || step1CustomerIdentify.lookupStatus || "",
      onboardingPermission:
        result?.data?.onboardingPermission ||
        step1CustomerIdentify.onboardingPermission ||
        "",
      ocrData: pendingOcrData || step1CustomerIdentify.ocrData,
    };
  }, [
    identifyAutosaveValues,
    pendingOcrData,
    result?.data?.lookupStatus,
    result?.data?.onboardingPermission,
    step1CustomerIdentify.customerCode,
    step1CustomerIdentify.customerId,
    step1CustomerIdentify.customerStatus,
    step1CustomerIdentify.lookupStatus,
    step1CustomerIdentify.ocrData,
    step1CustomerIdentify.onboardingPermission,
  ]);

  const step1Autosave = useDraftStepAutosave({
    draftCode: draftCode || step1CustomerIdentify.draftCode,
    stepCode: LOAN_APPLICATION_DRAFT_STEPS.customerIdentify,
    data: step1AutosavePayload,
    enabled: Boolean(draftCode || step1CustomerIdentify.draftCode),
    debounceMs: 1000,
  });

  useEffect(() => {
    setCurrentStep(CURRENT_STEP);
  }, [setCurrentStep]);

  useEffect(() => {
    return () => {
      revokeImagePreview(frontCccd);
      revokeImagePreview(backCccd);
    };
  }, [frontCccd, backCccd]);

  const validateImageFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Dung lượng ảnh không được vượt quá 5MB";
    }

    return "";
  };

  const applyOcrDataToForm = (ocrData: CustomerOcrData) => {
    const displayDateOfBirth = normalizeDateForDisplay(ocrData.dateOfBirth);
    const formattedDateOfBirth = convertDateToApiFormat(displayDateOfBirth);

    form.setValue("fullName", ocrData.fullName || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("dateOfBirth", displayDateOfBirth, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("identityNumber", ocrData.identityNumber || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    const currentPhoneNumber = form.getValues("phoneNumber") || "";

    setPendingOcrData({
      ...ocrData,
      dateOfBirthFormatted: formattedDateOfBirth,
      phoneNumber: currentPhoneNumber,
    });
  };

  const handleCheckOcr = async () => {
    if (!frontCccd) {
      const message =
        "Vui lòng upload đầy đủ CCCD mặt trước và mặt sau trước khi kiểm tra OCR";

      setOcrStatus({
        type: "error",
        message,
      });

      setStep1CustomerIdentify({
        ocrSuccessMessage: "",
        ocrErrorMessage: message,
      });
      toast.error(message);

      return;
    }

    setIsCheckingOcr(true);
    setUploadError("");
    setOcrStatus(null);

    setStep1CustomerIdentify({
      ocrSuccessMessage: "",
      ocrErrorMessage: "",
    });

    try {
      const response = await customerIdentifyApi.ocrCccd({
        cccdFrontImage: frontCccd.file,
        cccdBackImage: backCccd?.file,
      });

      if (!response.success || !response.data) {
        const message =
          response.message || "OCR thất bại. Vui lòng kiểm tra lại ảnh CCCD";

        setOcrStatus({
          type: "error",
          message,
        });

        setStep1CustomerIdentify({
          ocrSuccessMessage: "",
          ocrErrorMessage: message,
        });
        toast.error(message);

        return;
      }

      applyOcrDataToForm(response.data);

      const successMessage =
        response.message === "OCR extraction completed"
          ? "OCR thành công. Thông tin CCCD đã được tự động điền vào form."
          : response.message ||
            "OCR thành công. Thông tin đã được tự động điền vào form.";

      setOcrStatus({
        type: "success",
        message: successMessage,
      });

      setStep1CustomerIdentify({
        ocrSuccessMessage: successMessage,
        ocrErrorMessage: "",
      });
      toast.success(successMessage);
    } catch (error) {
      console.error("OCR error:", error);

      const message =
        "OCR thất bại. Vui lòng kiểm tra lại ảnh hoặc thử lại sau.";

      setOcrStatus({
        type: "error",
        message,
      });

      setStep1CustomerIdentify({
        ocrSuccessMessage: "",
        ocrErrorMessage: message,
      });
      toast.error(message);
    } finally {
      setIsCheckingOcr(false);
    }
  };

  const handleUploadImage = (
    event: ChangeEvent<HTMLInputElement>,
    side: UploadSide,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const errorMessage = validateImageFile(file);

    if (errorMessage) {
      setUploadError(errorMessage);

      setOcrStatus({
        type: "error",
        message: errorMessage,
      });

      setStep1CustomerIdentify({
        ocrSuccessMessage: "",
        ocrErrorMessage: errorMessage,
      });
      toast.error(errorMessage);

      event.target.value = "";
      return;
    }

    setUploadError("");
    setOcrStatus(null);

    setStep1CustomerIdentify({
      ocrSuccessMessage: "",
      ocrErrorMessage: "",
    });

    const previewUrl = URL.createObjectURL(file);

    const nextImage: UploadedImage = {
      file,
      previewUrl,
    };

    if (side === "front") {
      revokeImagePreview(frontCccd);
      setFrontCccd(nextImage);

      setStep1CustomerIdentify({
        frontImageMeta: buildImageMeta(file),
      });
    }

    if (side === "back") {
      revokeImagePreview(backCccd);
      setBackCccd(nextImage);

      setStep1CustomerIdentify({
        backImageMeta: buildImageMeta(file),
      });
    }

    event.target.value = "";
  };

  const handleRemoveImage = (side: UploadSide) => {
    setOcrStatus(null);

    setStep1CustomerIdentify({
      ocrSuccessMessage: "",
      ocrErrorMessage: "",
    });

    if (side === "front") {
      revokeImagePreview(frontCccd);
      setFrontCccd(null);

      setStep1CustomerIdentify({
        frontImageMeta: null,
      });
    }

    if (side === "back") {
      revokeImagePreview(backCccd);
      setBackCccd(null);

      setStep1CustomerIdentify({
        backImageMeta: null,
      });
    }
  };

  const handleClearInformation = () => {
    form.reset({
      fullName: "",
      dateOfBirth: "",
      phoneNumber: "",
      identityNumber: "",
    });

    revokeImagePreview(frontCccd);
    revokeImagePreview(backCccd);

    setFrontCccd(null);
    setBackCccd(null);
    setUploadError("");
    setOcrStatus(null);
    setResult(null);
    setPendingOcrData(null);

    clearStep1CustomerIdentify();
  };

  const handleCreateNewProfile = async () => {
    const isValidForm = await form.trigger();

    if (!isValidForm) {
      return;
    }

    const values = form.getValues();
    const formattedDateOfBirth = convertDateToApiFormat(values.dateOfBirth);
    const customerSnapshot = buildCustomerSnapshot(values, result, {
      ...step1CustomerIdentify,
      ocrData: pendingOcrData || step1CustomerIdentify.ocrData,
    });
    let customerCode =
      (result ? getMatchedCustomerCode(result) : "") ||
      customerSnapshot.customerCode ||
      step1CustomerIdentify.customerCode;
    const matchedCustomer = result?.data?.matchedCustomer || null;
    const selectedCustomer: Record<string, unknown> | null = matchedCustomer
      ? {
          ...customerSnapshot,
          ...matchedCustomer,
          customerCode,
        }
      : customerSnapshot;

    setIsSubmitting(true);
    setUploadError("");
    setOcrStatus(null);

    try {
      if (isBlockedLookup(result)) {
        throw new Error(getLookupBlockMessage(result));
      }

      if (!customerCode) {
        if (!canCreateCustomerFromLookup(result)) {
          throw new Error(getLookupBlockMessage(result));
        }

        const createCustomerResponse = await customerIdentifyApi.createCustomer({
          fullName: values.fullName,
          identifierNumber: values.identityNumber,
          phoneNumber: values.phoneNumber,
          dateOfBirth: formattedDateOfBirth,
        });

        if (!createCustomerResponse.success || !createCustomerResponse.data) {
          throw new Error(
            createCustomerResponse.message ||
              "Khong the tao khach hang moi. Vui long thu lai.",
          );
        }

        customerCode = createCustomerResponse.data.customerCode;
      }

      const draftResponse = await loanApplicationDraftApi.create({
        customerCode,
        customerIdentifyPayload: {
          ...customerSnapshot,
          customerCode,
          dateOfBirth: customerSnapshot.dateOfBirth || formattedDateOfBirth,
        },
      });

      if (!draftResponse.success || !draftResponse.data?.draftId) {
        throw new Error(
          draftResponse.message ||
            "Khong the tao ho so vay nhap. Vui long thu lai.",
        );
      }

      setDraftInfo({
        draftId: draftResponse.data.draftId,
        draftCode: draftResponse.data.draftCode || "",
        currentStepCode: draftResponse.data.currentStepCode || "",
      });

      setSelectedCustomer(
        selectedCustomer
          ? {
              ...selectedCustomer,
              customerCode,
            }
          : {
              ...customerSnapshot,
              customerCode,
            },
      );

      setStep1CustomerIdentify({
        ...customerSnapshot,
        fullName: customerSnapshot.fullName,
        dateOfBirth: customerSnapshot.dateOfBirth || formattedDateOfBirth,
        phoneNumber: customerSnapshot.phoneNumber,
        identityNumber: customerSnapshot.identityNumber,
        cccdNumber: customerSnapshot.cccdNumber,
        customerId: customerSnapshot.customerId,
        customerCode,
        customerStatus: customerSnapshot.customerStatus,
        draftId: draftResponse.data.draftId,
        draftCode: draftResponse.data.draftCode || "",
        currentStepCode: draftResponse.data.currentStepCode || "",
        customerCheckResult: result,
        ocrData: pendingOcrData || step1CustomerIdentify.ocrData,
        applicationCode: step1CustomerIdentify.applicationCode,
        loanApplicationCode: step1CustomerIdentify.loanApplicationCode,
      });

      setStep2PreliminaryInfo({
        fullName: customerSnapshot.fullName,
        identityNumber: customerSnapshot.identityNumber,
        phoneNumber: customerSnapshot.phoneNumber,
        dateOfBirth: customerSnapshot.dateOfBirth || formattedDateOfBirth,
        gender: customerSnapshot.gender,
        draftId: draftResponse.data.draftId,
        draftCode: draftResponse.data.draftCode || "",
        currentStepCode: draftResponse.data.currentStepCode || "",
        applicationCode: step1CustomerIdentify.applicationCode,
        loanApplicationCode: step1CustomerIdentify.loanApplicationCode,
      });

      setCurrentStep(2);

      navigate({
        to: "/loan/preliminary-info",
      });
    } catch (error) {
      console.error("Save step 1 state error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Khong the luu thong tin dinh danh. Vui long thu lai.";

      setUploadError(message);
      setOcrStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmit = async (values: CustomerIdentifyFormValues) => {
    setIsSubmitting(true);
    setUploadError("");
    setOcrStatus(null);
    setResult(null);

    try {
      const lookupPayload = {
        fullName: values.fullName || "",
        dateOfBirth: convertDateToApiFormat(values.dateOfBirth),
        identifierNumber: values.identityNumber || "",
        phoneNumber: values.phoneNumber || "",
      };

      const response = await customerIdentifyApi.checkCustomer(lookupPayload);

      setResult(response);

      setStep1CustomerIdentify({
        fullName: lookupPayload.fullName,
        dateOfBirth: lookupPayload.dateOfBirth,
        phoneNumber: lookupPayload.phoneNumber,
        identityNumber: lookupPayload.identifierNumber,
        cccdNumber: lookupPayload.identifierNumber,
        customerCheckResult: response,
        customerId: String(getMatchedCustomerId(response) || ""),
        customerCode: getMatchedCustomerCode(response),
        customerStatus:
          response.data?.customerStatus ||
          response.data?.customerState ||
          response.data?.lookupStatus ||
          "",
        lookupStatus: response.data?.lookupStatus || "",
        onboardingPermission: response.data?.onboardingPermission || "",
      });

      setSelectedCustomer(
        response.data?.matchedCustomer
          ? {
              ...response.data.matchedCustomer,
              customerCode: getMatchedCustomerCode(response),
            }
          : null,
      );
      toast.success("Tra cứu khách hàng thành công.");
    } catch (error) {
      console.error("Customer lookup error:", error);

      const message = getApiErrorMessage(
        error,
        "Có lỗi xảy ra khi tra cứu khách hàng",
      );

      setUploadError(message);

      setOcrStatus({
        type: "error",
        message,
      });

      setStep1CustomerIdentify({
        ocrSuccessMessage: "",
        ocrErrorMessage: message,
      });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <main className="min-h-screen">
        <section className="px-8 py-6">
          <CustomerIdentifyBreadcrumb currentStep={CURRENT_STEP} />

          <LoanOnboardingStepper currentStep={CURRENT_STEP} />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <Card className="rounded-xl border border-[#dbe5dd] bg-white shadow-none">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e9f8ee]">
                      <User size={24} color="#009b3a" variant="Outline" />
                    </div>

                    <div>
                      <h1 className="text-xl font-bold text-[#111827]">
                        Định danh khách hàng
                      </h1>

                      <p className="mt-1 text-sm text-[#6b7280]">
                        Upload CCCD, kiểm tra OCR và xác nhận thông tin định
                        danh khách hàng.
                      </p>
                      {(draftCode || step1CustomerIdentify.draftCode) && (
                        <p className="mt-2 text-xs font-medium text-[#15803d]">
                          {step1Autosave.status === "saving" && "Dang luu nhap..."}
                          {step1Autosave.status === "saved" && "Da luu nhap"}
                          {step1Autosave.status === "error" && "Luu nhap that bai"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập họ và tên"
                              className={[
                                "h-11",
                                hasPendingOcrFill
                                  ? "border-[#b7e4c7] bg-[#e8f8ee]"
                                  : "",
                              ].join(" ")}
                              value={field.value || ""}
                              name={field.name}
                              ref={field.ref}
                              onChange={field.onChange}
                              onBlur={(event) => {
                                const trimmedValue = event.target.value.trim();

                                if (trimmedValue !== event.target.value) {
                                  field.onChange(trimmedValue);
                                }

                                field.onBlur();
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày sinh *</FormLabel>

                          <FormControl>
                            <AppDatePicker
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Chọn ngày sinh"
                              autoFilled={hasPendingOcrFill}
                              buttonClassName="h-11 w-full justify-between rounded-lg border px-3 text-left transition-colors"
                              maxYear={new Date().getFullYear()}
                              disabledDate={(date) => date > new Date()}
                            />
                          </FormControl>

                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập số điện thoại"
                              className={[
                                "h-11",
                                hasPendingOcrFill
                                  ? "border-[#b7e4c7] bg-[#e8f8ee]"
                                  : "",
                              ].join(" ")}
                              value={field.value || ""}
                              onChange={(event) => {
                                const onlyNumber = event.target.value.replace(
                                  /\D/g,
                                  "",
                                );

                                field.onChange(onlyNumber);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              inputMode="numeric"
                              maxLength={11}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="identityNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số giấy tờ định danh *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập số giấy tờ"
                              className={[
                                "h-11",
                                hasPendingOcrFill
                                  ? "border-[#b7e4c7] bg-[#e8f8ee]"
                                  : "",
                              ].join(" ")}
                              value={field.value || ""}
                              onChange={(event) => {
                                const onlyNumber = event.target.value.replace(
                                  /\D/g,
                                  "",
                                );

                                field.onChange(onlyNumber);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              inputMode="numeric"
                              maxLength={12}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9f8ee]">
                          <Gallery
                            size={22}
                            color="#009b3a"
                            variant="Outline"
                          />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-[#111827]">
                            Ảnh giấy tờ định danh CCCD
                          </h2>

                          <p className="mt-1 text-sm text-[#6b7280]">
                            Upload ảnh CCCD mặt trước và mặt sau, sau đó bấm
                            Kiểm tra OCR để tự động điền thông tin.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <CCCDUploadBox
                        title="CCCD mặt trước"
                        description="Ảnh có chứa số CCCD, họ tên, ngày sinh"
                        image={frontCccd}
                        side="front"
                        onUpload={handleUploadImage}
                        onRemove={handleRemoveImage}
                      />

                      <CCCDUploadBox
                        title="CCCD mặt sau"
                        description="Ảnh có chứa ngày cấp, nơi cấp và mã QR"
                        image={backCccd}
                        side="back"
                        onUpload={handleUploadImage}
                        onRemove={handleRemoveImage}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCheckOcr}
                        disabled={isCheckingOcr}
                        className="shrink-0 border-[#009b3a] bg-green-600 text-white hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                      >
                        <Refresh
                          size={18}
                          color="currentColor"
                          variant="Outline"
                          className="mr-2"
                        />
                        {isCheckingOcr ? "Đang OCR..." : "Kiểm tra OCR"}
                      </Button>
                    </div>

                    {ocrStatus && (
                      <div
                        className={
                          ocrStatus.type === "success"
                            ? "mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                            : "mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                        }
                      >
                        {ocrStatus.message}
                      </div>
                    )}

                    {uploadError && !ocrStatus && (
                      <p className="mt-4 text-sm font-medium text-red-500">
                        {uploadError}
                      </p>
                    )}
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearInformation}
                      className="border-[#009b3a] text-[#009b3a] hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                    >
                      <Trash
                        size={18}
                        color="currentColor"
                        variant="Outline"
                        className="mr-2"
                      />
                      Xóa thông tin
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[170px] bg-[#009b3a] text-white hover:bg-[#008232]"
                    >
                      {isSubmitting ? "Đang tra cứu..." : "Tra cứu khách hàng"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <ResultCard
                result={result}
                onCreateNewProfile={handleCreateNewProfile}
              />
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
}

type ResultCardProps = {
  result: CustomerIdentifyResponse | null;
  onCreateNewProfile: () => void;
};

function ResultCard({ result, onCreateNewProfile }: ResultCardProps) {
  const found = Boolean(result?.data?.found);
  const matchedCustomer = result?.data?.matchedCustomer;
  const canContinue = found && result?.data?.onboardingPermission !== "BLOCKED";
  const canCreateNewCustomer = canCreateCustomerFromLookup(result);
  const isBlocked = Boolean(result && !canContinue && !canCreateNewCustomer);

  return (
    <Card className="rounded-xl border border-[#dbe5dd] bg-white shadow-none">
      <CardContent className="min-h-[250px] p-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e9f8ee]">
            <DocumentText size={24} color="#009b3a" variant="Outline" />
          </div>

          <h2 className="text-xl font-bold text-[#111827]">
            Kết quả kiểm tra khách hàng
          </h2>
        </div>

        {!result ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
            <DocumentText
              size={48}
              color="#b7e4c7"
              variant="Outline"
              className="mb-4"
            />

            <p className="text-sm text-[#9ca3af]">
              Kết quả sẽ hiển thị tại đây sau khi tra cứu thông tin khách hàng.
            </p>
          </div>
        ) : found ? (
          <div className="rounded-xl border bg-[#fbfffc] p-5">
            <p className="text-sm text-[#6b7280]">Trạng thái khách hàng</p>

            <h3 className="mt-1 text-lg font-bold text-[#111827]">
              Tìm thấy khách hàng trong hệ thống
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Mã khách hàng</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {result.data?.customerCode ||
                    matchedCustomer?.customerCode ||
                    "Chưa có"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Họ và tên</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {matchedCustomer?.fullName || "Chưa có"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Trạng thái</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {result.data?.customerStatus ||
                    result.data?.customerState ||
                    result.data?.lookupStatus ||
                    "Chưa xác định"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Số CCCD</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {matchedCustomer?.identifierNumber || "Chưa có"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Số điện thoại</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {matchedCustomer?.phoneNumber || "Chưa có"}
                </p>
              </div>

            </div>

            {!canContinue && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {getLookupBlockMessage(result)}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                disabled={!canContinue}
                onClick={onCreateNewProfile}
                className="bg-[#009b3a] text-white hover:bg-[#008232]"
              >
                Tiếp tục tạo hồ sơ vay
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm text-orange-700">Kết quả tra cứu</p>

            <h3 className="mt-1 text-lg font-bold text-[#111827]">
              Không tìm thấy khách hàng
            </h3>

            <p className="mt-2 text-sm text-[#6b7280]">
              Không có khách hàng nào khớp với thông tin đã nhập. Có thể tạo hồ
              sơ mới cho khách hàng này.
            </p>

            {result.message && (
              <p className="mt-2 text-sm font-medium text-[#6b7280]">
                {result.message}
              </p>
            )}

            {isBlocked && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {getLookupBlockMessage(result)}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                disabled={!canCreateNewCustomer}
                onClick={onCreateNewProfile}
                className="bg-[#009b3a] text-white hover:bg-[#008232]"
              >
                Tạo hồ sơ mới
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

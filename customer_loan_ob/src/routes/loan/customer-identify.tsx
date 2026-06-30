import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, isValid, parse } from "date-fns";

import {
  Calendar as CalendarIcon,
  DocumentText,
  Gallery,
  Refresh,
  Trash,
  User,
} from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { CCCDUploadBox } from "@/features/customer-identify/components/CCCDUploadBox";
import { CustomerIdentifyBreadcrumb } from "@/features/customer-identify/components/CustomerIdentifyBreadcrumb";
import { LoanOnboardingStepper } from "@/features/customer-identify/components/LoanOnboardingStepper";

import {
  customerIdentifySchema,
  type CustomerIdentifyFormValues,
} from "@/features/customer-identify/schemas/customer-identify.schema";

import { customerIdentifyApi } from "@/features/customer-identify/api/customer-identify.api";

import {
  getStep1Identity,
  saveStep1Identity,
} from "@/features/loan-onboarding/storage/loan-onboarding.storage";

import {
  clearAllCccdCachedImages,
  clearCccdCachedImage,
  getCccdCachedImages,
  setCccdCachedImage,
} from "@/features/customer-identify/storage/cccd-image-cache";

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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CUSTOMER_IDENTIFY_OCR_KEY = "customerIdentifyOcrData";

type OcrStatus = {
  type: "success" | "error";
  message: string;
};

function convertDdMmYyyyToIsoDate(value?: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parts = value.split("/");

  if (parts.length !== 3) {
    return value;
  }

  const [day, month, year] = parts;

  if (!day || !month || !year) {
    return value;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function CustomerIdentifyScreen() {
  const navigate = useNavigate();

  const step1Identity = getStep1Identity();

  const cachedImages = getCccdCachedImages();

  const [frontCccd, setFrontCccd] = useState<UploadedImage | null>(
    cachedImages.front,
  );

  const [backCccd, setBackCccd] = useState<UploadedImage | null>(
    cachedImages.back,
  );

  const [uploadError, setUploadError] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null);

  const [isCheckingOcr, setIsCheckingOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<CustomerIdentifyResponse | null>(null);

  const form = useForm<CustomerIdentifyFormValues>({
    resolver: zodResolver(customerIdentifySchema),
    defaultValues: {
      fullName: step1Identity?.fullName || "",
      dateOfBirth: step1Identity?.dateOfBirth || "",
      phoneNumber: step1Identity?.phoneNumber || "",
      identityNumber: step1Identity?.identityNumber || "",
    },
  });

  const validateImageFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Dung lượng ảnh không được vượt quá 5MB";
    }

    return "";
  };

  const saveCurrentStep1FormToSession = (customerId?: string) => {
    const currentValues = form.getValues();
    const oldStep1Identity = getStep1Identity();

    saveStep1Identity({
      ...oldStep1Identity,
      fullName: currentValues.fullName,
      dateOfBirth: currentValues.dateOfBirth,
      phoneNumber: currentValues.phoneNumber,
      identityNumber: currentValues.identityNumber,
      customerId: customerId || oldStep1Identity?.customerId,
    });
  };

  const applyOcrDataToForm = (ocrData: CustomerOcrData) => {
    const formattedDateOfBirth = convertDdMmYyyyToIsoDate(ocrData.dateOfBirth);

    form.setValue("fullName", ocrData.fullName || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("dateOfBirth", formattedDateOfBirth, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.setValue("identityNumber", ocrData.identityNumber || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    const currentPhoneNumber = form.getValues("phoneNumber");

    sessionStorage.setItem(
      CUSTOMER_IDENTIFY_OCR_KEY,
      JSON.stringify({
        ...ocrData,
        dateOfBirthFormatted: formattedDateOfBirth,
        phoneNumber: currentPhoneNumber,
        savedAt: new Date().toISOString(),
      }),
    );

    const oldStep1Identity = getStep1Identity();

    saveStep1Identity({
      ...oldStep1Identity,
      fullName: ocrData.fullName || oldStep1Identity?.fullName || "",
      dateOfBirth: formattedDateOfBirth || oldStep1Identity?.dateOfBirth || "",
      phoneNumber: currentPhoneNumber || oldStep1Identity?.phoneNumber || "",
      identityNumber:
        ocrData.identityNumber || oldStep1Identity?.identityNumber || "",
      documentType: ocrData.documentType || oldStep1Identity?.documentType,
      sex: ocrData.sex || oldStep1Identity?.sex,
      nationality: ocrData.nationality || oldStep1Identity?.nationality,
      issueDate: ocrData.issueDate || oldStep1Identity?.issueDate,
      expiryDate: ocrData.expiryDate || oldStep1Identity?.expiryDate,
    });
  };

  const handleCheckOcr = async () => {
    if (!frontCccd || !backCccd) {
      setOcrStatus({
        type: "error",
        message:
          "Vui lòng upload đầy đủ CCCD mặt trước và mặt sau trước khi kiểm tra OCR",
      });
      return;
    }

    setIsCheckingOcr(true);
    setUploadError("");
    setOcrStatus(null);

    try {
      const response = await customerIdentifyApi.ocrCccd({
        cccdFrontImage: frontCccd.file,
        cccdBackImage: backCccd.file,
      });

      if (!response.success || !response.data) {
        setOcrStatus({
          type: "error",
          message:
            response.message || "OCR thất bại. Vui lòng kiểm tra lại ảnh CCCD",
        });
        return;
      }

      applyOcrDataToForm(response.data);

      setOcrStatus({
        type: "success",
        message:
          response.message === "OCR extraction completed"
            ? "OCR thành công. Thông tin CCCD đã được tự động điền vào form."
            : response.message ||
              "OCR thành công. Thông tin đã được tự động điền vào form.",
      });
    } catch (error) {
      console.error("OCR error:", error);

      setOcrStatus({
        type: "error",
        message: "OCR thất bại. Vui lòng kiểm tra lại ảnh hoặc thử lại sau.",
      });
    } finally {
      setIsCheckingOcr(false);
    }
  };

  const handleUploadImage = (
    event: React.ChangeEvent<HTMLInputElement>,
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
      event.target.value = "";
      return;
    }

    setUploadError("");
    setOcrStatus(null);

    const previewUrl = URL.createObjectURL(file);

    const nextImage: UploadedImage = {
      file,
      previewUrl,
    };

    if (side === "front") {
      clearCccdCachedImage("front");
      setCccdCachedImage("front", nextImage);
      setFrontCccd(nextImage);
    }

    if (side === "back") {
      clearCccdCachedImage("back");
      setCccdCachedImage("back", nextImage);
      setBackCccd(nextImage);
    }

    event.target.value = "";
  };

  const handleRemoveImage = (side: UploadSide) => {
    setOcrStatus(null);

    if (side === "front") {
      clearCccdCachedImage("front");
      setFrontCccd(null);
    }

    if (side === "back") {
      clearCccdCachedImage("back");
      setBackCccd(null);
    }
  };

  const handleClearInformation = () => {
    form.reset({
      fullName: "",
      dateOfBirth: "",
      phoneNumber: "",
      identityNumber: "",
    });

    clearAllCccdCachedImages();

    setFrontCccd(null);
    setBackCccd(null);
    setUploadError("");
    setOcrStatus(null);
    setResult(null);

    sessionStorage.removeItem(CUSTOMER_IDENTIFY_OCR_KEY);

    saveStep1Identity({
      fullName: "",
      dateOfBirth: "",
      phoneNumber: "",
      identityNumber: "",
    });
  };

  const handleSaveTemporaryData = () => {
    saveCurrentStep1FormToSession();

    setOcrStatus({
      type: "success",
      message: "Đã lưu tạm thông tin định danh trong phiên làm việc",
    });
  };

  const handleSubmit = async (values: CustomerIdentifyFormValues) => {
    if (!frontCccd || !backCccd) {
      setUploadError("Vui lòng upload đầy đủ CCCD mặt trước và mặt sau");
      setOcrStatus({
        type: "error",
        message: "Vui lòng upload đầy đủ CCCD mặt trước và mặt sau",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadError("");
    setOcrStatus(null);
    setResult(null);

    try {
      const response = await customerIdentifyApi.checkCustomer({
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        phoneNumber: values.phoneNumber,
        identityNumber: values.identityNumber,
        cccdFrontImage: frontCccd.file,
        cccdBackImage: backCccd.file,
      });

      setResult(response);

      const oldStep1Identity = getStep1Identity();

      saveStep1Identity({
        ...oldStep1Identity,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        phoneNumber: values.phoneNumber,
        identityNumber: values.identityNumber,
        customerId: response.customerId,
      });

      navigate({
        to: "/loan/preliminary-info",
      });
    } catch (error) {
      console.error(error);

      setUploadError("Có lỗi xảy ra khi kiểm tra khách hàng");
      setOcrStatus({
        type: "error",
        message: "Có lỗi xảy ra khi kiểm tra khách hàng",
      });
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
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => {
                        const parsedDate = field.value
                          ? parse(field.value, "yyyy-MM-dd", new Date())
                          : undefined;

                        const selectedDate =
                          parsedDate && isValid(parsedDate)
                            ? parsedDate
                            : undefined;

                        return (
                          <FormItem>
                            <FormLabel>Ngày sinh *</FormLabel>

                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={
                                      selectedDate
                                        ? "h-11 w-full justify-between rounded-lg border border-[#cbd5e1] bg-white px-3 text-left font-normal text-[#111827]"
                                        : "h-11 w-full justify-between rounded-lg border border-[#cbd5e1] bg-white px-3 text-left font-normal text-[#94a3b8]"
                                    }
                                  >
                                    <span>
                                      {selectedDate
                                        ? format(selectedDate, "dd/MM/yyyy")
                                        : "Chọn ngày sinh"}
                                    </span>

                                    <CalendarIcon
                                      size={18}
                                      color="currentColor"
                                      variant="Outline"
                                    />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent
                                align="start"
                                sideOffset={8}
                                className="z-[9999] w-auto rounded-xl border border-[#dbe5dd] bg-white p-0 shadow-xl"
                              >
                                <div className="rounded-xl bg-white p-3">
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                      field.onChange(
                                        date ? format(date, "yyyy-MM-dd") : "",
                                      );
                                    }}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                    className="rounded-lg bg-white"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>

                            <FormMessage className="text-red-500" />
                          </FormItem>
                        );
                      }}
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
                              className="h-11"
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
                              className="h-11"
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
                        className="shrink-0 bg-green-600 border-[#009b3a] text-[white] hover:bg-[#ecfdf3] hover:text-[#009b3a]"
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

                    <div className="flex items-center gap-4">
                      {/* <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveTemporaryData}
                        className="min-w-[120px]"
                      >
                        Lưu tạm
                      </Button> */}

                      {/* <Button
                        type="button"
                        variant="outline"
                        className="min-w-[96px]"
                      >
                        Hủy
                      </Button> */}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-w-[170px] bg-[#009b3a] text-white hover:bg-[#008232]"
                      >
                        {isSubmitting
                          ? "Đang tra cứu..."
                          : "Tra cứu khách hàng"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ResultCard result={result} />
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
}

type ResultCardProps = {
  result: CustomerIdentifyResponse | null;
};

function ResultCard({ result }: ResultCardProps) {
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
        ) : (
          <div className="rounded-xl border bg-[#fbfffc] p-5">
            <p className="text-sm text-[#6b7280]">Trạng thái khách hàng</p>

            <h3 className="mt-1 text-lg font-bold text-[#111827]">
              {result.isExistingCustomer
                ? "Khách hàng đã tồn tại trong hệ thống"
                : "Khách hàng mới"}
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Blacklist</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {result.isBlacklisted ? "Có" : "Không"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Mức độ rủi ro</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {result.riskLevel || "Chưa xác định"}
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs text-[#6b7280]">Thông báo</p>

                <p className="mt-1 font-semibold text-[#111827]">
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

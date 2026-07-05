import { z } from "zod";

import {
  isValidAdultBirthDate,
  isValidCccd,
  isValidLicensePlate,
  isValidManufactureYear,
  isValidPositiveMoney,
  isValidRegistrationDisplayDate,
  isValidVehicleIdentifier,
  isValidVehicleOptionText,
  isValidVietnameseFullName,
  isValidVnPhone,
} from "@/lib/validation";

const phoneRegex = /^[0-9]{9,11}$/;

export const referencePersonSchema = z.object({
  fullName: z.string().optional(),
  relationshipType: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

export const customerAssetDetailSchema = z.object({
  fullName: z
    .string()
    .min(1, "Vui lòng nhập họ và tên")
    .refine(isValidVietnameseFullName, "Họ tên phải là tiếng Việt/chữ cái và có ít nhất 2 từ"),
  identityNumber: z
    .string()
    .min(1, "Vui lòng nhập số CCCD")
    .refine(isValidCccd, "CCCD phải gồm đúng 12 số"),
  phoneNumber: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .refine(isValidVnPhone, "Số điện thoại Việt Nam không hợp lệ"),
  dateOfBirth: z
    .string()
    .min(1, "Vui lòng nhập ngày sinh")
    .refine(isValidAdultBirthDate, "Ngày sinh không hợp lệ hoặc khách hàng chưa đủ tuổi"),
  gender: z.string().min(1, "Vui lòng chọn giới tính"),
  email: z
    .string()
    .email("Email không đúng định dạng")
    .or(z.literal(""))
    .optional(),
  maritalStatus: z.string().min(1, "Vui lòng chọn tình trạng hôn nhân"),
  dependentCount: z
    .string()
    .optional()
    .refine(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 4),
      "Số người phụ thuộc phải từ 0 đến 4",
    ),
  occupationCode: z.string().min(1, "Vui lòng chọn nghề nghiệp"),
  workplaceName: z.string().optional(),
  incomeSourceCode: z.string().min(1, "Vui lòng chọn nguồn thu nhập"),
  monthlyIncomeAmount: z
    .string()
    .min(1, "Vui lòng nhập thu nhập hàng tháng")
    .refine(
      isValidPositiveMoney,
      "Thu nhập hàng tháng phải là số lớn hơn 0",
    ),
  disbursementBankCode: z.string().min(1, "Vui lòng chọn ngân hàng"),
  disbursementAccountNumber: z.string().min(1, "Vui lòng nhập số tài khoản"),
  disbursementAccountName: z.string().min(1, "Vui lòng nhập chủ tài khoản"),
  permanentAddress: z.string().min(1, "Vui lòng nhập địa chỉ thường trú"),
  currentAddress: z.string().min(1, "Vui lòng nhập địa chỉ hiện tại"),

  references: z
    .array(referencePersonSchema)
    .min(3, "Cần tối thiểu 3 người tham chiếu"),

  assetType: z.string().min(1, "Vui lòng chọn loại tài sản"),
  licensePlate: z
    .string()
    .min(1, "Vui lòng nhập biển số xe")
    .refine(isValidLicensePlate, "Biển số xe không đúng định dạng Việt Nam"),
  brand: z.string().min(1, "Vui lòng chọn hãng xe"),
  model: z.string().min(1, "Vui lòng chọn dòng xe").refine(isValidVehicleOptionText, "Dòng xe không hợp lệ"),
  version: z.string().min(1, "Vui lòng chọn phiên bản").refine(isValidVehicleOptionText, "Phiên bản không hợp lệ"),
  vehicleVariant: z.string().optional(),
  manufactureYear: z
    .string()
    .min(1, "Vui lòng chọn năm sản xuất")
    .refine(isValidManufactureYear, "Năm sản xuất không hợp lệ"),
  vehicleColor: z.string().min(1, "Vui lòng chọn màu xe").refine(isValidVehicleOptionText, "Màu xe không hợp lệ"),
  selectedDeductionIds: z.array(z.string()).optional(),

  frameNumber: z
    .string()
    .min(1, "Vui lòng nhập số khung")
    .refine((value) => isValidVehicleIdentifier(value), "Số khung chỉ gồm chữ/số, 5-30 ký tự"),
  engineNumber: z
    .string()
    .min(1, "Vui lòng nhập số máy")
    .refine((value) => isValidVehicleIdentifier(value), "Số máy chỉ gồm chữ/số, 5-30 ký tự"),
  vehicleOwnerName: z.string().min(1, "Vui lòng nhập tên chủ sở hữu"),
  registrationNumber: z.string().optional(),
  registrationIssueDate: z
    .string()
    .optional()
    .refine(
      isValidRegistrationDisplayDate,
      "Ngày đăng ký xe phải có định dạng dd-mm-yyyy",
    ),

  selectedLoanProductCode: z.string().optional(),
}).superRefine((values, ctx) => {
  const completeReferences = values.references.filter(
    (item) =>
      Boolean(item.fullName?.trim()) &&
      Boolean(item.relationshipType?.trim()) &&
      Boolean(item.phoneNumber?.trim()),
  );

  values.references.forEach((item, index) => {
    const hasAnyValue =
      Boolean(item.fullName?.trim()) ||
      Boolean(item.relationshipType?.trim()) ||
      Boolean(item.phoneNumber?.trim()) ||
      Boolean(item.address?.trim()) ||
      Boolean(item.note?.trim());

    if (!hasAnyValue) return;

    if (!item.fullName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập họ tên người tham chiếu",
        path: ["references", index, "fullName"],
      });
    }

    if (!item.relationshipType?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng chọn mối quan hệ",
        path: ["references", index, "relationshipType"],
      });
    }

    if (!item.phoneNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập số điện thoại",
        path: ["references", index, "phoneNumber"],
      });
      return;
    }

    if (!phoneRegex.test(item.phoneNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Số điện thoại phải có từ 9 đến 11 số",
        path: ["references", index, "phoneNumber"],
      });
    }
  });

  if (completeReferences.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cần tối thiểu 3 người tham chiếu hợp lệ",
      path: ["references"],
    });
  }

  const phoneIndexes = new Map<string, number>();

  completeReferences.forEach((item) => {
    const originalIndex = values.references.indexOf(item);
    const phoneNumber = item.phoneNumber?.trim() || "";
    const duplicateIndex = phoneIndexes.get(phoneNumber);

    if (duplicateIndex !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Số điện thoại người tham chiếu bị trùng trong hồ sơ: ${phoneNumber}`,
        path: ["references", originalIndex, "phoneNumber"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Số điện thoại người tham chiếu bị trùng trong hồ sơ: ${phoneNumber}`,
        path: ["references", duplicateIndex, "phoneNumber"],
      });
      return;
    }

    phoneIndexes.set(phoneNumber, originalIndex);
  });
});

export type CustomerAssetDetailFormValues = z.infer<
  typeof customerAssetDetailSchema
>;

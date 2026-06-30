import { z } from "zod";

const phoneRegex = /^[0-9]{9,11}$/;

const validTerms = ["12", "36", "48", "72"];

const normalizePlateNumber = (value: string) => {
  return value.replace(/[\s.-]/g, "").toUpperCase();
};

const plateNumberRegex = /^[0-9]{2}[A-ZĐ]{1,2}[0-9]?[0-9]{4,5}$/i;

const isPositiveNumberString = (value: string) => {
  if (!value) return false;

  const normalizedValue = value.replace(/[.,\s]/g, "");

  return /^[0-9]+$/.test(normalizedValue) && Number(normalizedValue) > 0;
};

export const preliminaryInfoSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ và tên"),

  identityNumber: z.string().optional(),

  phoneNumber: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[0-9]+$/.test(value),
      "Số điện thoại chỉ được nhập số",
    )
    .refine(
      (value) => !value || phoneRegex.test(value),
      "Số điện thoại phải có từ 9 đến 11 số",
    ),

  dateOfBirth: z.string().optional(),

  gender: z.string().min(1, "Vui lòng chọn giới tính"),

  job: z.string().optional(),

  monthlyIncome: z
    .string()
    .optional()
    .refine(
      (value) => !value || isPositiveNumberString(value),
      "Thu nhập hàng tháng phải là số lớn hơn 0",
    ),

  loanPurpose: z.string().optional(),

  desiredLoanAmount: z
    .string()
    .min(1, "Vui lòng nhập số tiền mong muốn vay")
    .refine(
      (value) => isPositiveNumberString(value),
      "Số tiền mong muốn vay phải là số lớn hơn 0",
    ),

  term: z
    .string()
    .min(1, "Vui lòng chọn kỳ hạn")
    .refine((value) => validTerms.includes(value), "Kỳ hạn không hợp lệ"),

  assetType: z.string().min(1, "Vui lòng chọn loại tài sản"),

  plateNumber: z
    .string()
    .min(1, "Vui lòng nhập biển số xe")
    .refine(
      (value) => plateNumberRegex.test(normalizePlateNumber(value)),
      "Biển số xe không đúng định dạng",
    ),

  brand: z.string().optional(),

  model: z.string().optional(),

  version: z.string().optional(),

  manufactureYear: z.string().optional(),

  color: z.string().optional(),
});

export type PreliminaryInfoFormValues = z.infer<
  typeof preliminaryInfoSchema
>;
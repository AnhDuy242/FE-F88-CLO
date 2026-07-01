import { z } from "zod";

const phoneRegex = /^[0-9]{9,11}$/;
const validTerms = ["12", "36", "48", "72"];

const getDigitsOnly = (value: string) => {
  return value.replace(/\D/g, "");
};

const isPositiveNumberString = (value: string) => {
  if (!value) return false;

  const normalizedValue = getDigitsOnly(value);

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
  brand: z.string().min(1, "Vui lòng chọn hãng xe"),
  model: z.string().min(1, "Vui lòng chọn dòng xe"),
  version: z.string().min(1, "Vui lòng chọn phiên bản xe"),
  manufactureYear: z.string().min(1, "Vui lòng chọn năm sản xuất"),
  color: z.string().min(1, "Vui lòng chọn màu xe"),
});

export type PreliminaryInfoFormValues = z.infer<
  typeof preliminaryInfoSchema
>;
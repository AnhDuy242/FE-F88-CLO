import { z } from "zod";

import {
  isValidAdultBirthDate,
  isValidCccd,
  isValidPositiveMoney,
  isValidVietnameseFullName,
  isValidVnPhone,
} from "@/lib/validation";

export const preliminaryInfoSchema = z.object({
  fullName: z
    .string()
    .min(1, "Vui lòng nhập họ và tên")
    .refine(isValidVietnameseFullName, "Họ tên phải là tiếng Việt/chữ cái và có ít nhất 2 từ"),

  identityNumber: z
    .string()
    .min(1, "Vui lòng nhập số giấy tờ")
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

  job: z.string().min(1, "Vui lòng chọn nghề nghiệp"),

  monthlyIncome: z
    .string()
    .min(1, "Vui lòng nhập thu nhập hàng tháng")
    .refine(
      (value) => !value || isValidPositiveMoney(value),
      "Thu nhập hàng tháng phải là số lớn hơn 0",
    ),

  loanPurpose: z.string().min(1, "Vui lòng chọn mục đích vay"),

  desiredLoanAmount: z
    .string()
    .min(1, "Vui lòng nhập số tiền mong muốn vay")
    .refine(
      (value) => isValidPositiveMoney(value),
      "Số tiền mong muốn vay phải là số lớn hơn 0",
    ),

  term: z
    .string()
    .min(1, "Vui lòng chọn kỳ hạn")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, "Kỳ hạn không hợp lệ"),

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

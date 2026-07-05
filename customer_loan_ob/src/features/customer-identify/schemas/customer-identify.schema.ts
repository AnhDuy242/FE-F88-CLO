import { z } from "zod";

import {
  isValidAdultBirthDate,
  isValidCccd,
  isValidVietnameseFullName,
  isValidVnPhone,
} from "@/lib/validation";

export const customerIdentifySchema = z.object({
  fullName: z
    .string()
    .min(1, "Vui lòng nhập họ và tên")
    .refine(isValidVietnameseFullName, "Họ tên phải là tiếng Việt/chữ cái và có ít nhất 2 từ"),

  dateOfBirth: z
    .string()
    .min(1, "Vui lòng nhập ngày sinh")
    .refine(isValidAdultBirthDate, "Ngày sinh không hợp lệ hoặc khách hàng chưa đủ tuổi"),

  phoneNumber: z
    .string()
    .min(1, "Vui long nhap so dien thoai")
    .refine(
      isValidVnPhone,
      "Số điện thoại không hợp lệ"
    ),

  identityNumber: z
    .string()
    .min(1, "Vui lòng nhập số giấy tờ định danh")
    .refine(isValidCccd, "CCCD phải gồm đúng 12 số"),
});

export type CustomerIdentifyFormValues = z.infer<
  typeof customerIdentifySchema
>;

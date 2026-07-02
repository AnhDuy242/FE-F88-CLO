import { z } from "zod";

export const customerIdentifySchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ và tên"),

  dateOfBirth: z.string().min(1, "Vui lòng nhập ngày sinh"),

  phoneNumber: z
    .string()
    .min(1, "Vui long nhap so dien thoai")
    .refine(
      (value) => /^[0-9]{9,11}$/.test(value),
      "Số điện thoại không hợp lệ"
    ),

  identityNumber: z.string().min(1, "Vui lòng nhập số giấy tờ định danh"),
});

export type CustomerIdentifyFormValues = z.infer<
  typeof customerIdentifySchema
>;

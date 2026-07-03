import { z } from "zod";

const phoneRegex = /^[0-9]{9,11}$/;

const positiveCurrencyString = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");

  return digitsOnly !== "" && Number(digitsOnly) > 0;
};

export const referencePersonSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên người tham chiếu"),
  relationshipType: z.string().min(1, "Vui lòng chọn mối quan hệ"),
  phoneNumber: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(phoneRegex, "Số điện thoại phải có từ 9 đến 11 số"),
  address: z.string().optional(),
  note: z.string().optional(),
});

export const customerAssetDetailSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ và tên"),
  identityNumber: z.string().min(1, "Vui lòng nhập số CCCD"),
  phoneNumber: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .regex(phoneRegex, "Số điện thoại phải có từ 9 đến 11 số"),
  dateOfBirth: z.string().min(1, "Vui lòng nhập ngày sinh"),
  gender: z.string().min(1, "Vui lòng chọn giới tính"),
  email: z
    .string()
    .email("Email không đúng định dạng")
    .or(z.literal(""))
    .optional(),
  maritalStatus: z.string().min(1, "Vui lòng chọn tình trạng hôn nhân"),
  dependentCount: z.string().optional(),
  occupationCode: z.string().min(1, "Vui lòng chọn nghề nghiệp"),
  workplaceName: z.string().optional(),
  incomeSourceCode: z.string().min(1, "Vui lòng chọn nguồn thu nhập"),
  monthlyIncomeAmount: z
    .string()
    .min(1, "Vui lòng nhập thu nhập hàng tháng")
    .refine(
      positiveCurrencyString,
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
  licensePlate: z.string().min(1, "Vui lòng nhập biển số xe"),
  brand: z.string().min(1, "Vui lòng chọn hãng xe"),
  model: z.string().min(1, "Vui lòng chọn dòng xe"),
  version: z.string().min(1, "Vui lòng chọn phiên bản"),
  vehicleVariant: z.string().optional(),
  manufactureYear: z.string().min(1, "Vui lòng chọn năm sản xuất"),
  vehicleColor: z.string().min(1, "Vui lòng chọn màu xe"),
  selectedDeductionIds: z.array(z.string()).optional(),

  frameNumber: z.string().min(1, "Vui lòng nhập số khung"),
  engineNumber: z.string().min(1, "Vui lòng nhập số máy"),
  vehicleOwnerName: z.string().min(1, "Vui lòng nhập tên chủ sở hữu"),
  registrationNumber: z.string().optional(),
  registrationIssueDate: z.string().optional(),

  documentStatus: z.string().optional(),
  legalStatus: z.string().optional(),
  assetNote: z.string().optional(),

  selectedLoanProductCode: z.string().optional(),
});

export type CustomerAssetDetailFormValues = z.infer<
  typeof customerAssetDetailSchema
>;

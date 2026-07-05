import type { ApiResponse } from "@/features/preliminary-info/types/preliminary-info.type";

export type ReferenceOption = {
  label: string;
  value: string;
  description?: string | null;
};

export type SaveCustomerDetailPayload = {
  gender: string;
  email?: string;
  maritalStatus: string;
  occupationCode: string;
  incomeSourceCode: string;
  monthlyIncomeAmount: number;
  disbursementBankCode: string;
  disbursementAccountNumber: string;
  disbursementAccountName: string;
  workplaceName?: string;
  workplaceAddress?: string;
  permanentAddress: string;
  currentAddress: string;
};

export type ReferencePersonPayload = {
  fullName: string;
  phoneNumber: string;
  relationshipType: string;
  address?: string;
  note?: string;
};

export type SaveReferencePersonsPayload = {
  referencePersons: ReferencePersonPayload[];
};

export type SaveAssetSnapshotPayload = {
  assetType: "MOTORBIKE" | "CAR";
  licensePlate: string;
  brand: string;
  model: string;
  vehicleVariant: string;
  manufactureYear: number;
  vehicleColor: string;
};

export type SaveAssetLegalInfoPayload = {
  frameNumber: string;
  engineNumber: string;
};

export type SaveVehicleRegistrationPayload = {
  registrationNumber: string;
  registrationIssueDate: string;
};

export type Step3ApiResponse = ApiResponse<Record<string, unknown>>;

export type SubmitForApprovalResponse = ApiResponse<{
  applicationCode?: string;
  applicationState?: string;
  approvalCaseCode?: string;
  eventName?: string;
  submittedAt?: string;
  message?: string;
}>;

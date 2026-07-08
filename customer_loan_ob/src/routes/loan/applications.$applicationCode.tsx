import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  Car,
  CheckCircle2,
  FileCheck2,
  User,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { axiosClient } from "@/lib/axios-client";

export const Route = createFileRoute("/loan/applications/$applicationCode")({
  component: LoanApplicationDetailScreen,
});

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type DetailStep = {
  stepCode: string;
  stepName?: string;
  status?: string;
  payload?: Record<string, unknown>;
};

type DetailDocument = {
  documentId?: string;
  documentTypeCode?: string;
  documentTypeName?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string | null;
};

type LoanApplicationDetail = {
  applicationCode: string;
  applicationState?: string;
  applicationStateName?: string;
  currentStepCode?: string | null;
  currentStepName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  customer?: Record<string, unknown>;
  loanInfo?: Record<string, unknown> | null;
  asset?: Record<string, unknown> | null;
  valuation?: Record<string, unknown> | null;
  references?: Record<string, unknown>[];
  documents?: DetailDocument[];
  steps?: DetailStep[];
};

type InfoItem = {
  label: string;
  value: React.ReactNode;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pick(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }

  return undefined;
}

function text(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatCurrency(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return amount.toLocaleString("vi-VN") + "đ";
}

function formatPercent(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return text(value);
  return `${amount.toLocaleString("vi-VN")}%`;
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const parsedDate = new Date(String(value));
  if (Number.isNaN(parsedDate.getTime())) return text(value);
  return parsedDate.toLocaleDateString("vi-VN");
}

function formatDateTime(value: unknown) {
  if (!value) return "—";
  const parsedDate = new Date(String(value));
  if (Number.isNaN(parsedDate.getTime())) return text(value);

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function translateEnum(value: unknown) {
  const source = text(value, "");
  const labels: Record<string, string> = {
    ACTIVE: "Đang hoạt động",
    LEAD: "Khách hàng tiềm năng",
    BLACKLIST: "Danh sách đen",
    MALE: "Nam",
    FEMALE: "Nữ",
    SINGLE: "Độc thân",
    MARRIED: "Đã kết hôn",
    FATHER: "Bố",
    MOTHER: "Mẹ",
    SPOUSE: "Vợ/chồng",
    SIBLING: "Anh/chị/em",
    RELATIVE: "Người thân",
    FRIEND: "Bạn bè",
    COLLEAGUE: "Đồng nghiệp",
    OTHER: "Khác",
    AVAILABLE: "Sẵn sàng",
    PLEDGED: "Đã cầm cố",
    RELEASED: "Đã giải chấp",
    SETTLED: "Đã tất toán",
  };

  return labels[source] || source || "—";
}

function stateLabel(state?: string, serverName?: string) {
  if (serverName) return serverName;
  const labels: Record<string, string> = {
    APP_CREATED: "Đã tạo",
    APP_IN_PROGRESS: "Đang hoàn thiện",
    APP_COMPLETED: "Đã hoàn thiện",
    APP_SUBMITTED: "Đã nộp hồ sơ",
    APP_CANCELLED: "Đã hủy",
    APP_EXPIRED: "Hết hạn",
  };

  return labels[state || ""] || state || "—";
}

function getStepPayload(detail: LoanApplicationDetail, stepCode: string) {
  return asRecord(detail.steps?.find((step) => step.stepCode === stepCode)?.payload);
}

function greenText(value: React.ReactNode) {
  return <span className="font-semibold text-[#009b3a]">{value}</span>;
}

async function fetchApplicationDetail(applicationCode: string) {
  return axiosClient.get<
    ApiResponse<LoanApplicationDetail>,
    ApiResponse<LoanApplicationDetail>
  >(API_ENDPOINTS.loanApplication.detail(applicationCode));
}

function Section({
  value,
  icon,
  title,
  badge,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-2xl border border-[#d9e5dc] bg-white px-4 shadow-none"
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f8e9] text-[#009b3a]">
            {icon}
          </div>
          <span className="text-lg font-bold text-[#07130b]">{title}</span>
          {badge ? (
            <Badge className="rounded-full border-[#b8efc9] bg-[#e7faec] text-[#008934] hover:bg-[#e7faec]">
              {badge}
            </Badge>
          ) : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#d9e5dc] bg-[#fbfefc] p-4">
      <h3 className="mb-4 text-base font-bold text-[#07130b]">{title}</h3>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <div className="grid gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#56645c]">{item.label}</p>
          <div className="mt-1 break-words text-sm font-bold leading-6 text-[#07130b]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferenceGrid({ items }: { items: InfoItem[] }) {
  return (
    <div className="grid gap-x-8 gap-y-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#56645c]">{item.label}</p>
          <div className="mt-1 break-words text-sm font-bold leading-6 text-[#07130b]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferenceList({ references }: { references: Record<string, unknown>[] }) {
  if (references.length === 0) {
    return <p className="text-sm text-[#64748b]">Chưa có người tham chiếu.</p>;
  }

  return (
    <div className="space-y-3">
      {references.map((item, index) => (
        <div
          key={String(item.referencePersonId || index)}
          className="rounded-lg border border-[#d9e5dc] bg-white px-4 py-3"
        >
          <ReferenceGrid
            items={[
              { label: "Họ tên", value: text(item.fullName) },
              { label: "Quan hệ", value: translateEnum(item.relationshipType) },
              { label: "SĐT", value: text(item.phoneNumber) },
              { label: "Địa chỉ", value: text(item.address) },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

function DocumentGrid({ documents }: { documents: DetailDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-[#64748b]">Chưa có chứng từ đã upload.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => {
        const content = (
          <>
            <span className="min-w-0 truncate font-bold text-[#07130b]">
              {document.documentTypeName || document.documentTypeCode || "Chứng từ"}
            </span>
            <Badge className="shrink-0 gap-1 rounded-full border-[#b8efc9] bg-[#e7faec] text-[#009b3a] hover:bg-[#e7faec]">
              <CheckCircle2 className="h-3 w-3" />
              Đã upload
            </Badge>
          </>
        );

        if (document.fileUrl) {
          return (
            <a
              key={document.documentId || document.fileName}
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#d9e5dc] bg-white px-3 py-2 transition hover:border-[#009b3a]"
            >
              {content}
            </a>
          );
        }

        return (
          <div
            key={document.documentId || document.fileName}
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#d9e5dc] bg-white px-3 py-2"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

function LoanApplicationDetailScreen() {
  const { applicationCode } = Route.useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<LoanApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchApplicationDetail(applicationCode);
        if (!isActive) return;
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không tải được chi tiết hồ sơ.");
        }
        setDetail(response.data);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Không tải được chi tiết hồ sơ.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadDetail();

    return () => {
      isActive = false;
    };
  }, [applicationCode]);

  const viewModel = useMemo(() => {
    if (!detail) return null;

    const customer = asRecord(detail.customer);
    const loanInfo = asRecord(detail.loanInfo);
    const asset = asRecord(detail.asset);
    const valuation = asRecord(detail.valuation);
    const identifyPayload = getStepPayload(detail, "CUSTOMER_IDENTIFY");
    const proposalPayload = getStepPayload(detail, "CUSTOMER_ASSET_LOAN_PROPOSAL");
    const customerDetail = asRecord(pick(proposalPayload, ["customerDetail"]));
    const assetDetail = asRecord(pick(proposalPayload, ["assetDetail"]));
    const selectedOffer = asRecord(
      pick(proposalPayload, ["selectedLoanOffer", "selected_loan_offer", "selectedLoanProduct"])
    );
    const selectedDeductions = asArray(pick(proposalPayload, ["selectedDeductionItems", "deductions"]));

    const marketPrice = pick(valuation, ["marketPriceAmount"])
      || pick(proposalPayload, ["valuation", "marketPriceAmount"])
      || pick(asRecord(pick(proposalPayload, ["valuation"])), ["marketValue"]);
    const finalValue = pick(valuation, ["finalValueAmount"])
      || pick(asRecord(pick(proposalPayload, ["valuation"])), ["finalValue", "finalValueAmount"]);
    const requestedAmount = pick(loanInfo, ["requestedAmount"]);

    return {
      customerGeneral: [
        { label: "Họ tên", value: text(pick(customer, ["fullName"]) || pick(customerDetail, ["fullName"]) || pick(identifyPayload, ["fullName"])) },
        { label: "CCCD", value: text(pick(customer, ["identityNumber"]) || pick(customerDetail, ["identityNumber"]) || pick(identifyPayload, ["identityNumber"])) },
        { label: "Ngày sinh", value: formatDate(pick(customer, ["dateOfBirth"]) || pick(customerDetail, ["dateOfBirth"]) || pick(identifyPayload, ["dateOfBirth"])) },
        { label: "Giới tính", value: translateEnum(pick(customer, ["gender"]) || pick(customerDetail, ["gender"]) || pick(identifyPayload, ["gender"])) },
        { label: "Số điện thoại", value: text(pick(customer, ["phoneNumber"]) || pick(customerDetail, ["phoneNumber"]) || pick(identifyPayload, ["phoneNumber"])) },
        { label: "Email", value: text(pick(customer, ["email"]) || pick(customerDetail, ["email"])) },
        { label: "Địa chỉ thường trú", value: text(pick(customer, ["permanentAddress"]) || pick(customerDetail, ["permanentAddress"])) },
        { label: "Địa chỉ hiện tại", value: text(pick(loanInfo, ["currentAddress"]) || pick(customerDetail, ["currentAddress"])) },
        { label: "Tình trạng hôn nhân", value: translateEnum(pick(customer, ["maritalStatus"]) || pick(customerDetail, ["maritalStatus"])) },
      ],
      customerPrivate: [
        { label: "Nghề nghiệp", value: text(pick(loanInfo, ["occupationName", "occupationCode"]) || pick(customerDetail, ["occupationCode"])) },
        { label: "Công ty", value: text(pick(loanInfo, ["workplaceName"]) || pick(customerDetail, ["workplaceName"])) },
        { label: "Nguồn thu nhập", value: text(pick(loanInfo, ["incomeSourceName", "incomeSourceCode"]) || pick(customerDetail, ["incomeSourceCode"])) },
        { label: "Thu nhập hàng tháng", value: formatCurrency(pick(loanInfo, ["monthlyIncomeAmount"]) || pick(customerDetail, ["monthlyIncomeAmount"])) },
        { label: "Số người phụ thuộc", value: text(pick(customerDetail, ["dependentCount"])) },
      ],
      assetGeneral: [
        { label: "Biển số xe", value: text(pick(asset, ["licensePlate"]) || pick(assetDetail, ["licensePlate"])) },
        { label: "Hãng xe", value: text(pick(asset, ["vehicleBrandName", "vehicleBrandCode"])) },
        { label: "Dòng xe", value: text(pick(asset, ["vehicleModelName", "vehicleModelCode"])) },
        { label: "Phiên bản", value: text(pick(asset, ["vehicleVersionName", "vehicleVersionCode"])) },
        { label: "Năm sản xuất", value: text(pick(asset, ["manufactureYear"])) },
        { label: "Màu xe", value: text(pick(asset, ["vehicleColorName", "vehicleColorCode"])) },
      ],
      assetPrivate: [
        { label: "Số khung", value: text(pick(asset, ["frameNumber"]) || pick(assetDetail, ["frameNumber"])) },
        { label: "Số máy", value: text(pick(asset, ["engineNumber"]) || pick(assetDetail, ["engineNumber"])) },
        { label: "Chủ xe", value: text(pick(customer, ["fullName"]) || pick(customerDetail, ["fullName"])) },
        { label: "Tình trạng giấy tờ", value: text(pick(assetDetail, ["documentStatus"]), "Đầy đủ") },
        { label: "Tình trạng pháp lý", value: text(pick(assetDetail, ["legalStatus"]), "Hợp lệ") },
        { label: "Giá thị trường", value: formatCurrency(marketPrice) },
        { label: "Tổng khấu trừ", value: selectedDeductions.length > 0 ? `${selectedDeductions.length} mục` : formatCurrency(pick(valuation, ["totalDeductionAmount"])) },
        { label: "Giá định giá", value: formatCurrency(finalValue) },
        { label: "Ghi chú", value: text(pick(valuation, ["note"])) },
      ],
      loanPackage: [
        { label: "Sản phẩm", value: text(pick(loanInfo, ["loanProductName", "loanProductCode"]) || pick(selectedOffer, ["productName", "productCode"])) },
        { label: "Gói vay", value: text(pick(loanInfo, ["loanProductName", "loanProductCode"]) || pick(selectedOffer, ["name", "productName"])) },
        { label: "Khoản vay đề xuất", value: formatCurrency(pick(selectedOffer, ["finalRequestedAmount", "final_requested_amount"]) || requestedAmount) },
        { label: "Khoản vay phê duyệt", value: formatCurrency(requestedAmount) },
        { label: "Kỳ hạn", value: text(pick(loanInfo, ["loanTermName"]) || (pick(loanInfo, ["loanTermMonths"]) ? `${pick(loanInfo, ["loanTermMonths"])} tháng` : undefined)) },
        { label: "LTV tối đa", value: formatPercent(pick(loanInfo, ["loanProductMaxLtvPercent"])) },
        { label: "Hình thức trả", value: text(pick(selectedOffer, ["repaymentMethod"]), "Trả góp hàng tháng") },
        { label: "Ngày trả", value: text(pick(selectedOffer, ["paymentDate"]), "Ngày 25 hàng tháng") },
        { label: "Mục đích vay", value: text(pick(loanInfo, ["loanPurposeName", "loanPurposeCode"])) },
      ],
      disbursement: [
        { label: "Ngân hàng", value: text(pick(loanInfo, ["disbursementBankName", "disbursementBankCode"])) },
        { label: "Số tài khoản", value: text(pick(loanInfo, ["disbursementAccountNumber"])) },
        { label: "Chủ tài khoản", value: text(pick(loanInfo, ["disbursementAccountName"])) },
        { label: "Chi nhánh xử lý", value: text(pick(loanInfo, ["branch"])) },
      ],
    };
  }, [detail]);

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-8 py-6">
      <Button
        type="button"
        variant="ghost"
        className="mb-5 gap-2 px-0 font-semibold text-[#07130b] hover:bg-transparent hover:text-[#009b3a]"
        onClick={() => navigate({ to: "/loan/applications" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : error || !detail || !viewModel ? (
        <div className="rounded-2xl border border-[#d9e5dc] bg-white px-6 py-10 text-center">
          <p className="font-semibold text-red-600">
            {error || "Không tìm thấy hồ sơ."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-[#07130b]">Chi tiết hồ sơ vay</h1>
                <Badge className="rounded-full border-[#b8efc9] bg-[#e7faec] text-[#009b3a] hover:bg-[#e7faec]">
                  {stateLabel(detail.applicationState, detail.applicationStateName)}
                </Badge>
              </div>
              <p className="mt-2 text-base text-[#56645c]">
                Mã hồ sơ: {greenText(detail.applicationCode)} · Chi nhánh:{" "}
                {text(pick(asRecord(detail.loanInfo), ["branch"]))}
              </p>
            </div>

            <div className="text-sm leading-6 text-[#56645c] lg:text-right">
              <p>Tạo: {formatDateTime(detail.createdAt)}</p>
              <p>Cập nhật: {formatDateTime(detail.updatedAt)}</p>
            </div>
          </div>

          <Accordion
            type="multiple"
            defaultValue={["customer", "asset", "loan-product", "documents"]}
            className="max-w-[1180px] space-y-4"
          >
            <Section
              value="customer"
              icon={<User className="h-5 w-5" />}
              title="Thông tin Khách hàng"
              badge="Khách hàng"
            >
              <Panel title="Thông tin chung">
                <InfoGrid items={viewModel.customerGeneral} />
              </Panel>
              <Panel title="Thông tin riêng (Nghề nghiệp & Thu nhập)">
                <InfoGrid items={viewModel.customerPrivate} />
              </Panel>
              <Panel title="Người tham chiếu">
                <ReferenceList references={detail.references || []} />
              </Panel>
            </Section>

            <Section
              value="asset"
              icon={<Car className="h-5 w-5" />}
              title="Thông tin Tài sản"
            >
              <Panel title="Thông tin chung">
                <InfoGrid items={viewModel.assetGeneral} />
              </Panel>
              <Panel title="Thông tin riêng (Pháp lý & Định giá)">
                <InfoGrid items={viewModel.assetPrivate} />
              </Panel>
            </Section>

            <Section
              value="loan-product"
              icon={<Banknote className="h-5 w-5" />}
              title="Thông tin Sản phẩm vay"
              badge={text(pick(asRecord(detail.loanInfo), ["loanProductName"]), "")}
            >
              <Panel title="Gói vay & Khoản vay">
                <InfoGrid items={viewModel.loanPackage} />
              </Panel>
              <Panel title="Thông tin giải ngân">
                <InfoGrid items={viewModel.disbursement} />
              </Panel>
            </Section>

            <Section
              value="documents"
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Chứng từ & Kết quả Scoring, OCR eKYC"
            >
              <Panel title="Danh sách chứng từ đã upload">
                <DocumentGrid documents={detail.documents || []} />
              </Panel>
            </Section>
          </Accordion>
        </>
      )}
    </div>
  );
}

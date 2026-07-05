import { ArrowLeft2, ArrowRight2, DocumentText } from "iconsax-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrencyVnd } from "@/lib/currency";

import type { LoanProductRecommendationProduct } from "@/features/preliminary-info/types/loan-product-recommendation.type";

type LoanRecommendationPanelProps = {
  open: boolean;
  onToggle: () => void;
  isLoading: boolean;
  error: string;
  products: LoanProductRecommendationProduct[];
  requestedLoanAmount: number;
  loanTermMonths: number;
  paymentMethod?: string;
  firstPaymentDate?: string;
  processingBranch?: string;
  recommendedProductCode?: string;
  selectedProductCode?: string;
  waitingMessage: string;
};

function formatText(value?: string | number) {
  const normalizedValue = String(value || "").trim();

  return normalizedValue || "Chưa có dữ liệu";
}

function getDisplayProduct(
  products: LoanProductRecommendationProduct[],
  selectedProductCode?: string,
  recommendedProductCode?: string,
) {
  return (
    products.find((product) => product.productCode === selectedProductCode) ||
    products.find((product) => product.productCode === recommendedProductCode) ||
    products.find((product) => product.recommended) ||
    products[0]
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eef2ef] py-3 last:border-b-0">
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className="max-w-[55%] text-right text-sm font-bold text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#dbe5dd] bg-white p-4 transition-all duration-200 hover:border-[#b7e4c7] hover:shadow-sm">
      <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function LoanRecommendationPanel({
  open,
  onToggle,
  isLoading,
  error,
  products,
  requestedLoanAmount,
  loanTermMonths,
  paymentMethod,
  firstPaymentDate,
  processingBranch,
  recommendedProductCode,
  selectedProductCode,
  waitingMessage,
}: LoanRecommendationPanelProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Mở panel đề xuất khoản vay"
        aria-label="Mở panel đề xuất khoản vay"
        className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-[#b7e4c7] bg-white px-3 py-4 text-sm font-bold text-[#009b3a] shadow-lg transition-all duration-200 hover:bg-[#ecfdf3]"
      >
        <ArrowLeft2 size={16} color="currentColor" variant="Outline" />
        Mở đề xuất
      </button>
    );
  }

  const finalProduct = getDisplayProduct(
    products,
    selectedProductCode,
    recommendedProductCode,
  );

  return (
    <aside className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-[#dbe5dd] bg-white shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8ee]">
            <DocumentText size={22} color="#009b3a" variant="Outline" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              Đề xuất khoản vay
            </h2>
            <p className="text-xs text-[#64748b]">Cập nhật theo dữ liệu hồ sơ</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          title="Thu gọn panel đề xuất khoản vay"
          aria-label="Thu gọn panel đề xuất khoản vay"
          className="h-9 rounded-full px-3 text-xs font-bold text-[#009b3a] transition-colors hover:bg-[#ecfdf3] hover:text-[#008232]"
        >
          Thu gọn
          <ArrowRight2 size={18} color="currentColor" variant="Outline" />
        </Button>
      </div>

      <div className="space-y-4 bg-[#f8fbf8] p-5">
        <PanelSection title="A. Nhu cầu vay (có thể điều chỉnh)">
          <InfoRow
            label="Số tiền muốn vay (VNĐ)"
            value={
              requestedLoanAmount > 0
                ? formatCurrencyVnd(requestedLoanAmount)
                : "Chưa có dữ liệu"
            }
          />
          <InfoRow
            label="Kỳ hạn (tháng)"
            value={loanTermMonths > 0 ? String(loanTermMonths) : "Chưa có dữ liệu"}
          />
        </PanelSection>

        <PanelSection title="B. Thông tin khoản vay">
          <InfoRow label="Hình thức thanh toán" value={formatText(paymentMethod)} />
          <InfoRow label="Ngày thanh toán kỳ đầu" value={formatText(firstPaymentDate)} />
          <InfoRow label="Chi nhánh xử lý" value={formatText(processingBranch)} />
        </PanelSection>

        <PanelSection title="C. Gói vay cuối cùng được đề xuất">
          {isLoading ? (
            <div className="rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] px-4 py-5 text-sm font-medium text-[#64748b]">
              Đang lấy đề xuất gói vay...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : finalProduct ? (
            <div className="rounded-xl border border-[#009b3a] bg-[#ecfdf3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#111827]">
                    {finalProduct.productName || finalProduct.productCode}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {finalProduct.productCode}
                  </p>
                </div>
                {(recommendedProductCode === finalProduct.productCode ||
                  finalProduct.recommended) && (
                  <span className="rounded-full bg-[#009b3a] px-3 py-1 text-xs font-bold text-white">
                    Khuyến nghị
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#64748b]">Hạn mức</p>
                  <p className="mt-1 font-bold text-[#111827]">
                    {formatCurrencyVnd(
                      finalProduct.suggestedLoanAmount ||
                        finalProduct.effectiveMaxLoanAmount ||
                        finalProduct.productMaxLoanAmount ||
                        finalProduct.maxLoanAmount,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">Trả hàng tháng</p>
                  <p className="mt-1 font-bold text-[#111827]">
                    {formatCurrencyVnd(finalProduct.estimatedMonthlyPayment)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] px-4 py-5 text-sm font-medium text-[#64748b]">
              {products.length === 0
                ? "Không có gói vay nào đáp ứng điều kiện hiện tại."
                : waitingMessage}
            </div>
          )}
        </PanelSection>
      </div>
    </aside>
  );
}

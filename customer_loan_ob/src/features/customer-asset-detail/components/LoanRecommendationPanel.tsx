import { ArrowLeft2, ArrowRight2, DocumentText } from "iconsax-react";

import { Button } from "@/components/ui/button";

import type { LoanProductRecommendationProduct } from "@/features/preliminary-info/types/loan-product-recommendation.type";

type LoanRecommendationPanelProps = {
  open: boolean;
  onToggle: () => void;
  isLoading: boolean;
  error: string;
  products: LoanProductRecommendationProduct[];
  recommendedProductCode?: string;
  selectedProductCode?: string;
  onSelectProduct: (productCode: string) => void;
  waitingMessage: string;
};

function formatCurrency(value?: number) {
  const safeValue = Number(value || 0);

  if (safeValue <= 0) return "Chưa có";

  return `${safeValue.toLocaleString("vi-VN")} đ`;
}

export function LoanRecommendationPanel({
  open,
  onToggle,
  isLoading,
  error,
  products,
  recommendedProductCode,
  selectedProductCode,
  onSelectProduct,
  waitingMessage,
}: LoanRecommendationPanelProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-[#b7e4c7] bg-white px-3 py-4 text-sm font-bold text-[#009b3a] shadow-lg"
      >
        <ArrowLeft2 size={16} color="currentColor" variant="Outline" />
        Đề xuất gói vay
      </button>
    );
  }

  return (
    <aside className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-[#dbe5dd] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8ee]">
            <DocumentText size={22} color="#009b3a" variant="Outline" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827]">
              Đề xuất gói vay
            </h2>
            <p className="text-xs text-[#64748b]">Cập nhật theo dữ liệu hồ sơ</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          className="h-9 w-9 rounded-full p-0"
        >
          <ArrowRight2 size={18} color="currentColor" variant="Outline" />
        </Button>
      </div>

      <div className="space-y-3 p-5">
        {isLoading ? (
          <div className="rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] px-4 py-5 text-sm font-medium text-[#64748b]">
            Đang lấy đề xuất gói vay...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] px-4 py-5 text-sm font-medium text-[#64748b]">
            {waitingMessage}
          </div>
        ) : (
          products.map((product) => {
            const isSelected = selectedProductCode === product.productCode;
            const isRecommended =
              recommendedProductCode === product.productCode ||
              product.recommended;

            return (
              <button
                key={product.productCode}
                type="button"
                onClick={() => onSelectProduct(product.productCode)}
                className={
                  isSelected
                    ? "w-full rounded-xl border border-[#009b3a] bg-[#ecfdf3] p-4 text-left shadow-sm"
                    : "w-full rounded-xl border border-[#dbe5dd] bg-white p-4 text-left hover:border-[#009b3a]"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#111827]">
                      {product.productName || product.productCode}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {product.productCode}
                    </p>
                  </div>

                  {isRecommended && (
                    <span className="rounded-full bg-[#009b3a] px-3 py-1 text-xs font-bold text-white">
                      Khuyến nghị
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[#64748b]">Hạn mức</p>
                    <p className="mt-1 font-bold text-[#111827]">
                      {formatCurrency(
                        product.suggestedLoanAmount ||
                          product.effectiveMaxLoanAmount ||
                          product.productMaxLoanAmount ||
                          product.maxLoanAmount,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">Trả hàng tháng</p>
                    <p className="mt-1 font-bold text-[#111827]">
                      {formatCurrency(product.estimatedMonthlyPayment)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

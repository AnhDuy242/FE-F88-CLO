import { Check, ChevronDown } from "lucide-react";

import type { LoanProductRecommendationProduct } from "../types/loan-product-recommendation.type";

type LoanPackageSelectorProps = {
  products: LoanProductRecommendationProduct[];
  recommendedProductCode?: string;
  selectedProductCode: string;
  selectedTerm: string;
  requestedLoanAmount: number;
  isLoading?: boolean;
  error?: string;
  onSelectProduct: (productCode: string) => void;
  onSelectTerm: (term: string) => void;
};

const termOptions = ["12", "36", "48", "72"];

function formatCurrencyVnd(value: number) {
  return `${Math.round(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}%/tháng`;
}

export function LoanPackageSelector({
  products,
  recommendedProductCode,
  selectedProductCode,
  selectedTerm,
  requestedLoanAmount,
  isLoading,
  error,
  onSelectProduct,
  onSelectTerm,
}: LoanPackageSelectorProps) {
  const selectedProduct =
    products.find((item) => item.productCode === selectedProductCode) ||
    products.find((item) => item.productCode === recommendedProductCode) ||
    products.find((item) => item.recommended) ||
    products[0];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#dbe5dd] bg-white px-5 py-6 text-sm font-medium text-[#64748b]">
        Đang lấy đề xuất gói vay phù hợp...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dbe5dd] bg-white px-5 py-6 text-sm font-medium text-[#64748b]">
        Chưa có đề xuất khoản vay. Hệ thống sẽ tự động đề xuất sau khi có đủ
        mục đích vay, kỳ hạn, số tiền vay và kết quả định giá tài sản.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-base font-semibold text-[#334155]">
        Chọn gói vay
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {products.map((product) => {
          const selected = product.productCode === selectedProduct?.productCode;
          const recommended =
            product.recommended ||
            product.productCode === recommendedProductCode;

          return (
            <button
              key={product.productCode}
              type="button"
              onClick={() => {
                onSelectProduct(product.productCode);
              }}
              className={[
                "relative min-h-[190px] rounded-2xl border bg-white p-5 text-left transition",
                selected
                  ? "border-[#009b3a] bg-[#f4fbf5]"
                  : "border-[#dbe5dd] hover:border-[#009b3a]",
              ].join(" ")}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[#111827]">
                    {product.productName}
                  </p>

                  {recommended && (
                    <span className="mt-2 inline-flex rounded-full bg-[#dff4df] px-3 py-1 text-xs font-semibold text-[#166534]">
                      Khuyến nghị
                    </span>
                  )}
                </div>

                <span
                  className={[
                    "flex size-7 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-[#009b3a] bg-[#009b3a] text-white"
                      : "border-[#94a3b8] bg-white text-transparent",
                  ].join(" ")}
                >
                  <Check size={16} />
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#64748b]">Lãi suất</span>
                  <span className="font-bold text-[#111827]">
                    {formatPercent(product.monthlyInterestRatePercent)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#64748b]">LTV tối đa</span>
                  <span className="font-bold text-[#111827]">
                    {product.maxLtvPercent}%
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#64748b]">Vay tối đa</span>
                  <span className="font-bold text-[#111827]">
                    {formatCurrencyVnd(product.effectiveMaxLoanAmount)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#64748b]">Kỳ hạn</span>
                  <span className="font-bold text-[#111827]">
                    {product.loanTenor} tháng
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProduct && (
        <div className="mt-6 rounded-2xl bg-[#008b05] px-6 py-6 text-white">
          <p className="mb-6 text-lg font-bold">Tóm tắt khoản vay</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-white/70">Gói vay</p>
              <p className="mt-2 font-bold">{selectedProduct.productName}</p>
            </div>

            <div>
              <p className="text-sm text-white/70">Số tiền đề xuất</p>
              <p className="mt-2 font-bold">
                {formatCurrencyVnd(selectedProduct.suggestedLoanAmount)}
              </p>
            </div>

            <div>
              <p className="text-sm text-white/70">Lãi suất</p>
              <p className="mt-2 font-bold">
                {formatPercent(selectedProduct.monthlyInterestRatePercent)}
              </p>
            </div>

            <div>
              <p className="text-sm text-white/70">Kỳ hạn</p>

              <div className="relative mt-2 inline-flex">
                <select
                  value={selectedTerm}
                  onChange={(event) => {
                    onSelectTerm(event.target.value);
                  }}
                  className="h-9 appearance-none rounded-xl border border-white/25 bg-white/10 px-4 pr-9 text-sm font-bold text-white outline-none"
                >
                  {termOptions.map((term) => (
                    <option key={term} value={term} className="text-black">
                      {term} tháng
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="my-6 h-px bg-white/20" />

          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold text-white/80">
                Dự kiến trả hàng tháng
              </p>

              {requestedLoanAmount > selectedProduct.effectiveMaxLoanAmount && (
                <p className="mt-2 text-sm text-yellow-100">
                  Số tiền mong muốn đang lớn hơn hạn mức hiệu lực, hệ thống đề
                  xuất theo hạn mức tối đa phù hợp.
                </p>
              )}
            </div>

            <p className="text-3xl font-bold">
              {formatCurrencyVnd(selectedProduct.estimatedMonthlyPayment)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
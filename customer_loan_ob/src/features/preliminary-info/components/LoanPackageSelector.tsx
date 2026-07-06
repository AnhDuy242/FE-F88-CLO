import type { LoanProductRecommendationProduct } from "@/features/preliminary-info/types/loan-product-recommendation.type";
import { formatCurrencyVnd } from "@/lib/currency";

type LoanPackageSelectorProps = {
  products: LoanProductRecommendationProduct[];
  recommendedProductCode?: string;
  selectedProductCode: string;
  selectedTerm: string;
  isLoading?: boolean;
  error?: string;
  onSelectProduct: (productCode: string) => void;
};

function formatPercent(value?: number) {
  const safeValue = Number(value);

  if (!Number.isFinite(safeValue) || safeValue <= 0) return "Chưa có";

  return `${safeValue.toLocaleString("vi-VN")}%`;
}

function formatOptionalCurrency(value?: number) {
  const safeValue = Number(value);

  return Number.isFinite(safeValue) && safeValue > 0
    ? formatCurrencyVnd(safeValue)
    : "Chưa có";
}

function firstPositiveNumber(values: Array<number | undefined>) {
  for (const value of values) {
    const safeValue = Number(value);

    if (Number.isFinite(safeValue) && safeValue > 0) {
      return safeValue;
    }
  }

  return 0;
}

function getProductDisplayAmount(product: LoanProductRecommendationProduct | undefined) {
  if (!product) return 0;

  return firstPositiveNumber([
    product.suggestedLoanAmount,
    product.loanAmountCap,
    product.effectiveMaxLoanAmount,
    product.productMaxLoanAmount,
  ]);
}

function getProductMaxAmount(product: LoanProductRecommendationProduct | undefined) {
  if (!product) return 0;

  return firstPositiveNumber([
    product.effectiveMaxLoanAmount,
    product.productMaxLoanAmount,
    product.maxLoanByLtv,
    product.loanAmountCap,
  ]);
}

function getProductInterestRate(
  product: LoanProductRecommendationProduct | undefined,
) {
  if (!product) return 0;

  return Number(product.monthlyInterestRatePercent || 0);
}

function getProductTenor(
  product: LoanProductRecommendationProduct | undefined,
  fallbackTerm: string,
) {
  if (!product) return fallbackTerm;

  return String(
    product.tenor ||
      product.loanTermMonths ||
      product.loanTerm ||
      product.term ||
      product.durationMonths ||
      product.selectedTenor ||
      fallbackTerm ||
      "",
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[82px] flex-col justify-between rounded-xl bg-white/10 px-4 py-3">
      <p className="text-sm leading-5 text-white/80">{label}</p>
      <p className="mt-2 break-words text-lg font-bold leading-6">{value}</p>
    </div>
  );
}

export function LoanPackageSelector({
  products,
  recommendedProductCode,
  selectedProductCode,
  selectedTerm,
  isLoading = false,
  error = "",
  onSelectProduct,
}: LoanPackageSelectorProps) {
  const selectedProduct =
    products.find((product) => product.productCode === selectedProductCode) ||
    products.find((product) => product.recommended) ||
    products[0];

  const selectedDisplayAmount = getProductDisplayAmount(selectedProduct);

  const selectedInterestRate = getProductInterestRate(selectedProduct);

  const selectedTenor = getProductTenor(selectedProduct, selectedTerm);

  return (
    <div>
      <div>
        <h3 className="text-base font-bold text-[#111827]">Chọn gói vay</h3>

        <p className="mt-1 text-sm text-[#64748b]">
          Hệ thống sẽ đề xuất tối đa 3 gói vay phù hợp theo tài sản, kỳ hạn và
          nhu cầu vay.
        </p>
      </div>

      {isLoading && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Đang lấy đề xuất khoản vay...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="mt-4 rounded-lg border border-[#dbe5dd] bg-[#f8fbf8] px-4 py-5 text-sm text-[#64748b]">
          Chưa có gói vay được đề xuất. Vui lòng nhập đủ mục đích vay, số tiền
          mong muốn vay, kỳ hạn và thông tin định giá tài sản.
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => {
              const isSelected =
                selectedProductCode === product.productCode ||
                (!selectedProductCode &&
                  selectedProduct?.productCode === product.productCode);

              const isRecommended =
                product.recommended ||
                product.productCode === recommendedProductCode;

              const productMaxAmount = getProductMaxAmount(product);
              const productInterestRate = getProductInterestRate(product);
              const productTenor = getProductTenor(product, selectedTerm);

              return (
                <button
                  key={product.productCode}
                  type="button"
                  onClick={() => onSelectProduct(product.productCode)}
                  className={[
                    "rounded-xl border bg-white p-5 text-left transition",
                    isSelected
                      ? "border-[#009b3a] ring-1 ring-[#009b3a]"
                      : "border-[#dbe5dd] hover:border-[#009b3a]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-[#111827]">
                        {product.productName || product.productCode}
                      </h4>

                      {isRecommended && (
                        <span className="mt-2 inline-flex rounded-full bg-[#e8f8e8] px-3 py-1 text-xs font-semibold text-[#009b3a]">
                          Khuyến nghị
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#009b3a] text-sm font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#64748b]">Lãi suất</span>
                      <span className="font-bold text-[#111827]">
                        {productInterestRate
                          ? `${productInterestRate.toLocaleString(
                              "vi-VN",
                            )}%/tháng`
                          : "Chưa có"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#64748b]">LTV tối đa</span>
                      <span className="font-bold text-[#111827]">
                        {formatPercent(product.maxLtvPercent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#64748b]">Hạn mức hiệu lực</span>
                      <span className="font-bold text-[#111827]">
                        {formatOptionalCurrency(productMaxAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#64748b]">Khoảng vay</span>
                      <span className="font-bold text-[#111827]">
                        {Number(product.minLoanAmount) > 0 && productMaxAmount > 0
                          ? `${formatCurrencyVnd(product.minLoanAmount)} - ${formatCurrencyVnd(productMaxAmount)}`
                          : "Chưa có"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#64748b]">Kỳ hạn</span>
                      <span className="font-bold text-[#111827]">
                        {productTenor ? `${productTenor} tháng` : "Chưa có"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-[#009b0f] p-6 text-white">
            <h3 className="text-xl font-bold">Tóm tắt khoản vay</h3>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryItem
                label="Gói vay"
                value={
                  selectedProduct?.productName ||
                  selectedProduct?.productCode ||
                  "-"
                }
              />
              <SummaryItem
                label="Số tiền đề xuất"
                value={formatOptionalCurrency(selectedDisplayAmount)}
              />
              <SummaryItem
                label="Lãi suất"
                value={
                  selectedInterestRate
                    ? `${selectedInterestRate.toLocaleString("vi-VN")}%/tháng`
                    : "Chưa có"
                }
              />
              <SummaryItem
                label="Kỳ hạn"
                value={selectedTenor ? `${selectedTenor} tháng` : "Chưa có"}
              />
              <SummaryItem
                label="Gốc hàng tháng"
                value={formatOptionalCurrency(selectedProduct?.principalPerMonth)}
              />
              <SummaryItem
                label="Lãi hàng tháng"
                value={formatOptionalCurrency(selectedProduct?.interestPerMonth)}
              />
              <SummaryItem
                label="Tạm tính hàng tháng"
                value={formatOptionalCurrency(
                  selectedProduct?.estimatedMonthlyPayment,
                )}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}


import type { LoanProductRecommendationProduct } from "@/features/preliminary-info/types/loan-product-recommendation.type";
import type { ReferenceOption } from "@/features/preliminary-info/types/reference-data.type";
import { formatCurrencyVnd } from "@/lib/currency";

type LoanPackageSelectorProps = {
  products: LoanProductRecommendationProduct[];
  recommendedProductCode?: string;
  selectedProductCode: string;
  selectedTerm: string;
  termOptions: ReferenceOption[];
  isLoading?: boolean;
  error?: string;
  onSelectProduct: (productCode: string) => void;
  onSelectTerm: (term: string) => void;
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

function getProductDisplayAmount(product: LoanProductRecommendationProduct | undefined) {
  if (!product) return 0;

  return (
    Number(product.suggestedLoanAmount) ||
    Number(product.loanAmountCap) ||
    Number(product.effectiveMaxLoanAmount) ||
    Number(product.productMaxLoanAmount) ||
    0
  );
}

function getProductMaxAmount(product: LoanProductRecommendationProduct | undefined) {
  if (!product) return 0;

  return (
    Number(product.effectiveMaxLoanAmount) ||
    Number(product.productMaxLoanAmount) ||
    Number(product.maxLoanByLtv) ||
    Number(product.loanAmountCap) ||
    0
  );
}

function getProductInterestRate(
  product: LoanProductRecommendationProduct | undefined,
) {
  if (!product) return 0;

  return Number(product.monthlyInterestRatePercent || 0);
}

function getProductTenor(
  product: LoanProductRecommendationProduct | undefined,
) {
  return String(product?.tenor || "");
}

export function LoanPackageSelector({
  products,
  recommendedProductCode,
  selectedProductCode,
  selectedTerm,
  termOptions,
  isLoading = false,
  error = "",
  onSelectProduct,
  onSelectTerm,
}: LoanPackageSelectorProps) {
  const selectedProduct =
    products.find((product) => product.productCode === selectedProductCode) ||
    products.find((product) => product.recommended) ||
    products[0];

  const selectedDisplayAmount = getProductDisplayAmount(selectedProduct);

  const selectedInterestRate = getProductInterestRate(selectedProduct);

  const selectedTenor = getProductTenor(selectedProduct);

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
                        {product.tenor ? `${product.tenor} tháng` : "Chưa có"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-[#009b0f] p-6 text-white">
            <h3 className="text-xl font-bold">Tóm tắt khoản vay</h3>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4">
              <div>
                <p className="text-sm text-white/80">Gói vay</p>
                <p className="mt-2 text-lg font-bold">
                  {selectedProduct?.productName ||
                    selectedProduct?.productCode ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/80">Số tiền đề xuất</p>
                <p className="mt-2 text-lg font-bold">
                  {formatOptionalCurrency(selectedDisplayAmount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/80">Lãi suất</p>
                <p className="mt-2 text-lg font-bold">
                  {selectedInterestRate
                    ? `${selectedInterestRate.toLocaleString("vi-VN")}%/tháng`
                    : "Chưa có"}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/80">Kỳ hạn</p>

                <select
                  value={selectedTerm || selectedTenor}
                  onChange={(event) => onSelectTerm(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-white/30 bg-[#0ab02a] px-3 text-sm font-bold text-white outline-none"
                >
                  {termOptions.length > 0 ? (
                    termOptions.map((term) => (
                      <option
                        key={term.value}
                        value={term.value}
                        className="text-[#111827]"
                      >
                        {term.label}
                      </option>
                    ))
                  ) : (
                    <option value={selectedTerm} className="text-[#111827]">
                      {selectedTerm ? `${selectedTerm} tháng` : "Chưa có"}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <p className="text-sm text-white/80">Gốc hàng tháng</p>
                <p className="mt-2 text-lg font-bold">
                  {formatOptionalCurrency(selectedProduct?.principalPerMonth)}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/80">Lãi hàng tháng</p>
                <p className="mt-2 text-lg font-bold">
                  {formatOptionalCurrency(selectedProduct?.interestPerMonth)}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/80">Tạm tính hàng tháng</p>
                <p className="mt-2 text-lg font-bold">
                  {formatOptionalCurrency(selectedProduct?.estimatedMonthlyPayment)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


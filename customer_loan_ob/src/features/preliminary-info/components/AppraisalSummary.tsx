type AppraisalSummaryProps = {
  marketValue: number;
  totalDeductionPercent: number;
  totalDeductionAmount?: number;
  valueAfterDeduction: number;
  maxLoanByAppraisal: number;
  ltv: number;
  isLoading?: boolean;
};

function formatCurrencyVnd(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")} đ`;
}

export function AppraisalSummary({
  marketValue,
  totalDeductionAmount = 0,
  valueAfterDeduction,
  maxLoanByAppraisal,
  ltv,
  isLoading,
}: AppraisalSummaryProps) {
  const safeMarketValue = Number.isFinite(marketValue) ? marketValue : 0;
  const safeDeductionAmount = Number.isFinite(totalDeductionAmount)
    ? totalDeductionAmount
    : 0;
  const safeValueAfterDeduction = Number.isFinite(valueAfterDeduction)
    ? valueAfterDeduction
    : 0;
  const safeMaxLoanByAppraisal = Number.isFinite(maxLoanByAppraisal)
    ? maxLoanByAppraisal
    : 0;

  return (
    <div>
      <div className="mb-6">
        <p className="text-base font-semibold text-[#111827]">
          Kết quả định giá sơ bộ
        </p>

        <p className="mt-1 text-sm text-[#64748b]">
          Hệ thống sẽ tự động tính khi nhập đủ thông tin tài sản.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="rounded-xl bg-[#eff8ef] px-6 py-5">
          <p className="text-sm text-[#64748b]">Giá trị thị trường</p>
          <p className="mt-3 text-2xl font-bold text-[#111827]">
            {isLoading ? "Đang tính..." : formatCurrencyVnd(safeMarketValue)}
          </p>
        </div>

        <div className="rounded-xl bg-[#fde8eb] px-6 py-5">
          <p className="text-sm text-[#64748b]">Tổng giảm trừ</p>
          <p className="mt-3 text-2xl font-bold text-red-600">
            {isLoading
              ? "Đang tính..."
              : safeDeductionAmount > 0
                ? `-${formatCurrencyVnd(safeDeductionAmount)}`
                : "0 đ"}
          </p>
        </div>

        <div className="rounded-xl bg-[#e6f6e6] px-6 py-5">
          <p className="text-sm text-[#64748b]">Giá sau giảm trừ</p>
          <p className="mt-3 text-2xl font-bold text-[#009b3a]">
            {isLoading
              ? "Đang tính..."
              : formatCurrencyVnd(safeValueAfterDeduction)}
          </p>
        </div>

        <div className="rounded-xl bg-[#e6f6e6] px-6 py-5">
          <p className="text-sm text-[#64748b]">Khoản vay tối đa</p>
          <p className="mt-3 text-2xl font-bold text-[#009b3a]">
            {isLoading
              ? "Đang tính..."
              : formatCurrencyVnd(safeMaxLoanByAppraisal)}
          </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-[#475569]">Tỷ lệ LTV</p>
          <p className="text-sm font-semibold text-[#111827]">{ltv}%</p>
        </div>

        <div className="h-3 rounded-full bg-[#e3f3e3]">
          <div
            className="h-3 rounded-full bg-[#009b3a]"
            style={{
              width: `${Math.min(Math.max(ltv, 0), 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
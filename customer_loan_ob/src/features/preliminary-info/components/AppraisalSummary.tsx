type AppraisalSummaryProps = {
  marketValue: number;
  totalDeductionPercent: number;
  valueAfterDeduction: number;
  maxLoanByAppraisal: number;
  ltv: number;
  isLoading?: boolean;
};

export function AppraisalSummary({
  marketValue,
  totalDeductionPercent,
  valueAfterDeduction,
  maxLoanByAppraisal,
  ltv,
  isLoading,
}: AppraisalSummaryProps) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111827]">
            Kết quả định giá sơ bộ
          </p>

          <p className="mt-1 text-sm text-[#64748b]">
            Hệ thống sẽ tự động tính khi nhập đủ thông tin tài sản.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-full bg-[#e9f8ee] px-4 py-2 text-sm font-semibold text-[#009b3a]">
            Đang tự động tính...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryBox
          title="Giá trị thị trường"
          value={formatCurrency(marketValue)}
          className="bg-[#f0faf0]"
        />

        <SummaryBox
          title="Tổng giảm trừ"
          value={`-${totalDeductionPercent}%`}
          className="bg-[#feecef]"
          valueClassName="text-red-600"
        />

        <SummaryBox
          title="Giá sau giảm trừ"
          value={formatCurrency(valueAfterDeduction)}
          className="bg-[#eaf8eb]"
          valueClassName="text-[#009b3a]"
        />

        <SummaryBox
          title="Khoản vay tối đa"
          value={formatCurrency(maxLoanByAppraisal)}
          className="bg-[#eaf8eb]"
          valueClassName="text-[#009b3a]"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[#374151]">Tỷ lệ LTV</span>

          <span className="text-sm font-bold text-[#111827]">{ltv}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#e5f3e6]">
          <div
            className="h-full rounded-full bg-[#009b3a]"
            style={{ width: `${ltv}%` }}
          />
        </div>
      </div>
    </>
  );
}

type SummaryBoxProps = {
  title: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

function SummaryBox({
  title,
  value,
  className = "",
  valueClassName = "text-[#111827]",
}: SummaryBoxProps) {
  return (
    <div className={`rounded-xl p-5 ${className}`}>
      <p className="text-sm text-[#64748b]">{title}</p>

      <p className={`mt-2 text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value || 0)) + " đ";
}
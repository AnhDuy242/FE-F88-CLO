import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrencyVnd } from "@/lib/currency";

import type { DeductionItem } from "../types/preliminary-info.type";

type DeductionListProps = {
  deductions: DeductionItem[];
  selectedIds: string[];
  marketValue: number;
  deductionAmountsById?: Record<string, number>;
  onToggle: (id: string, checked: boolean) => void;
};

export function DeductionList({
  deductions,
  selectedIds,
  marketValue,
  deductionAmountsById = {},
  onToggle,
}: DeductionListProps) {
  const hasMarketValue = Number.isFinite(marketValue) && marketValue > 0;

  if (deductions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#dbe5dd] bg-white px-4 py-5 text-sm text-[#64748b]">
        Chưa có dữ liệu yếu tố giảm trừ.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {deductions.map((deduction) => {
        const checked = selectedIds.includes(deduction.id);

        const amountFromPreview = deductionAmountsById[deduction.id] ?? 0;

        const amountFromRate =
          hasMarketValue && deduction.percent > 0
            ? (marketValue * deduction.percent) / 100
            : 0;

        const displayAmount = amountFromPreview || amountFromRate;

        const displayText = (() => {
          if (!hasMarketValue) return "Chờ định giá";

          if (displayAmount > 0) {
            return `-${formatCurrencyVnd(displayAmount)}`;
          }

          return "0 đ";
        })();

        return (
          <label
            key={deduction.id}
            className={[
              "flex min-h-[56px] cursor-pointer items-center justify-between rounded-xl border bg-white px-4 py-3 transition",
              checked
                ? "border-[#009b3a] bg-[#f2fbf5]"
                : "border-[#dbe5dd] hover:border-[#009b3a]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => {
                  onToggle(deduction.id, Boolean(value));
                }}
              />

              <span className="text-base font-medium text-[#111827]">
                {deduction.label}
              </span>
            </div>

            <span
              className={[
                "text-base font-semibold",
                checked ? "text-red-500" : "text-[#64748b]",
              ].join(" ")}
            >
              {displayText}
            </span>
          </label>
        );
      })}
    </div>
  );
}

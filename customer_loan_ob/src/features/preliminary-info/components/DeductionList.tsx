import { Checkbox } from "@/components/ui/checkbox";

import type { DeductionItem } from "../types/preliminary-info.type";

type DeductionListProps = {
  deductions: DeductionItem[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
};

export function DeductionList({
  deductions,
  selectedIds,
  onToggle,
}: DeductionListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {deductions.map((item) => {
        const checked = selectedIds.includes(item.id);

        return (
          <div
            key={item.id}
            className="flex h-14 items-center justify-between rounded-xl border bg-white px-4"
          >
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => onToggle(item.id, Boolean(value))}
              />

              <span className="text-base text-[#111827]">{item.label}</span>
            </label>

            <span className="font-semibold text-red-500">
              -{item.percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
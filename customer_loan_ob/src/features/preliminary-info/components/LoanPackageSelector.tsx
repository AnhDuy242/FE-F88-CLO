import { useState } from "react";
import { TickCircle } from "iconsax-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  LoanPackage,
  LoanPackageId,
} from "../types/preliminary-info.type";

type LoanPackageSelectorProps = {
  loanPackages: LoanPackage[];
  selectedPackageId: LoanPackageId;
  selectedTerm: string;
  monthlyPayment: number;
  onSelectPackage: (id: LoanPackageId) => void;
  onSelectTerm: (term: string) => void;
};

export function LoanPackageSelector({
  loanPackages,
  selectedPackageId,
  selectedTerm,
  monthlyPayment,
  onSelectPackage,
  onSelectTerm,
}: LoanPackageSelectorProps) {
  const [termSelectOpen, setTermSelectOpen] = useState(false);

  const selectedPackage =
    loanPackages.find((item) => item.id === selectedPackageId) ||
    loanPackages[0];

  return (
    <>
      <p className="mb-4 text-sm font-semibold text-[#374151]">Chọn gói vay</p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {loanPackages.map((item) => (
          <LoanPackageCard
            key={item.id}
            item={item}
            selected={selectedPackageId === item.id}
            onSelect={() => {
              if (!item.disabled) {
                onSelectPackage(item.id);
                onSelectTerm(String(item.terms[0]));
              }
            }}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-[#008a05] p-6 text-white">
        <h3 className="text-lg font-bold">Tóm tắt khoản vay</h3>

        <div className="mt-6 grid grid-cols-1 gap-6 border-b border-white/25 pb-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-white/75">Gói vay</p>
            <p className="mt-2 font-bold">{selectedPackage.name}</p>
          </div>

          <div>
            <p className="text-sm text-white/75">Khoản vay tối đa</p>
            <p className="mt-2 font-bold">
              {formatCurrency(selectedPackage.maxLoanAmount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-white/75">Lãi suất</p>
            <p className="mt-2 font-bold">
              {selectedPackage.interestRate}%/tháng
            </p>
          </div>

          <div>
            <p className="text-sm text-white/75">Kỳ hạn</p>

            <Select
              open={termSelectOpen}
              onOpenChange={setTermSelectOpen}
              value={selectedTerm}
              onValueChange={(value) => {
                onSelectTerm(value);
                setTermSelectOpen(false);
              }}
            >
              <SelectTrigger className="mt-2 h-9 w-[120px] rounded-xl border border-white/30 bg-white text-[#111827] data-[placeholder]:text-[#94a3b8]">
                <SelectValue placeholder="Kỳ hạn" />
              </SelectTrigger>

              <SelectContent
                position="popper"
                sideOffset={6}
                className="z-[9999] rounded-xl border border-[#dbe5dd] bg-white p-1 text-[#111827] shadow-xl"
              >
                {selectedPackage.terms.map((term) => (
                  <SelectItem
                    key={term}
                    value={String(term)}
                    className="cursor-pointer rounded-lg bg-white text-[#111827] focus:bg-[#ecfdf3] focus:text-[#009b3a] data-[state=checked]:bg-[#e9f8ee] data-[state=checked]:text-[#009b3a]"
                  >
                    {term} tháng
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-lg font-semibold text-white/90">
            Dự kiến trả hàng tháng
          </p>

          <p className="text-3xl font-bold">
            {formatCurrency(monthlyPayment)}
          </p>
        </div>
      </div>
    </>
  );
}

type LoanPackageCardProps = {
  item: LoanPackage;
  selected: boolean;
  onSelect: () => void;
};

function LoanPackageCard({ item, selected, onSelect }: LoanPackageCardProps) {
  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={onSelect}
      className={
        selected
          ? "relative rounded-2xl border-2 border-[#009b3a] bg-[#f7fff8] p-5 text-left"
          : item.disabled
            ? "relative rounded-2xl border border-[#dbe5dd] bg-[#f8fbf8] p-5 text-left opacity-60"
            : "relative rounded-2xl border border-[#dbe5dd] bg-white p-5 text-left hover:border-[#009b3a]"
      }
    >
      <div className="absolute right-5 top-5">
        {selected ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#009b3a] text-white">
            <TickCircle size={18} color="currentColor" variant="Bold" />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-[#94a3b8]" />
        )}
      </div>

      <h3 className="text-lg font-bold text-[#111827]">{item.name}</h3>

      {item.tag && (
        <span className="mt-2 inline-flex rounded-full bg-[#dff3e5] px-3 py-1 text-xs font-semibold text-[#166534]">
          {item.tag}
        </span>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <PackageInfoRow
          label="Lãi suất"
          value={`${item.interestRate}%/tháng`}
        />

        <PackageInfoRow label="LTV tối đa" value={`${item.ltv}%`} />

        <PackageInfoRow
          label="Vay tối đa"
          value={formatCurrency(item.maxLoanAmount)}
        />

        <PackageInfoRow
          label="Kỳ hạn"
          value={`${item.terms.join(", ")} tháng`}
        />
      </div>
    </button>
  );
}

type PackageInfoRowProps = {
  label: string;
  value: string;
};

function PackageInfoRow({ label, value }: PackageInfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-bold text-[#111827]">{value}</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " đ";
}
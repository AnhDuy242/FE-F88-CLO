import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDateToDisplay,
  normalizeDateForDisplay,
  parseDateValue,
} from "@/lib/date";

const MONTH_OPTIONS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
].map((label, value) => ({ label, value }));

function getYearOptions(minYear: number, maxYear: number) {
  return Array.from(
    { length: Math.max(maxYear - minYear + 1, 1) },
    (_, index) => maxYear - index,
  );
}

function getInitialMonth(value?: string, defaultMonth?: Date) {
  return parseDateValue(value) || defaultMonth || new Date();
}

type AppDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFilled?: boolean;
  buttonClassName?: string;
  minYear?: number;
  maxYear?: number;
  disabledDate?: (date: Date) => boolean;
};

export function AppDatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  autoFilled,
  buttonClassName,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  disabledDate,
}: AppDatePickerProps) {
  const displayValue = normalizeDateForDisplay(value);
  const selectedDate = parseDateValue(displayValue);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    getInitialMonth(displayValue),
  );
  const yearOptions = useMemo(
    () => getYearOptions(minYear, maxYear),
    [maxYear, minYear],
  );
  const currentMonth = calendarMonth.getMonth();
  const currentYear = calendarMonth.getFullYear();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={[
            buttonClassName ||
              "h-12 w-full justify-between rounded-xl border px-4 text-left transition-colors",
            displayValue
              ? "border-[#dbe5dd] bg-white font-normal text-[#111827]"
              : "border-[#dbe5dd] bg-white font-normal text-[#94a3b8]",
            autoFilled && displayValue ? "border-[#b7e4c7] bg-[#e8f8ee]" : "",
          ].join(" ")}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon size={18} color="currentColor" variant="Outline" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[9999] w-auto rounded-xl border border-[#dbe5dd] bg-white p-0 shadow-xl"
      >
        <div className="rounded-xl bg-white">
          <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-3 py-3">
            <select
              value={currentMonth}
              onChange={(event) => {
                setCalendarMonth(
                  new Date(currentYear, Number(event.target.value), 1),
                );
              }}
              className="h-9 rounded-lg border border-[#dbe5dd] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#009b3a]"
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(event) => {
                setCalendarMonth(
                  new Date(Number(event.target.value), currentMonth, 1),
                );
              }}
              className="h-9 rounded-lg border border-[#dbe5dd] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#009b3a]"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3">
            <Calendar
              mode="single"
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={selectedDate}
              onSelect={(date) => {
                onChange(date ? formatDateToDisplay(date) : "");

                if (date) {
                  setCalendarMonth(date);
                }
              }}
              disabled={(date) =>
                Boolean(disabledDate?.(date)) ||
                date < new Date(minYear, 0, 1) ||
                date > new Date(maxYear, 11, 31)
              }
              className="rounded-lg bg-white"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

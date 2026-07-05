import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";

import { AppDatePicker } from "@/components/shared/AppDatePicker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyInput } from "@/lib/currency";

import type { CustomerAssetDetailFormValues } from "@/features/customer-asset-detail/schemas/customer-asset-detail.schema";
import type { ReferenceOption } from "@/features/customer-asset-detail/types/customer-asset-detail.type";

type FieldProps = {
  form: UseFormReturn<CustomerAssetDetailFormValues>;
  name: FieldPath<CustomerAssetDetailFormValues>;
  label: string;
  placeholder?: string;
  required?: boolean;
};

type TextFieldProps = FieldProps & {
  onlyNumber?: boolean;
  uppercase?: boolean;
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  formatCurrencyVnd?: boolean;
  onAfterChange?: (value: string) => void;
  autoFilled?: boolean;
};

export function CustomerAssetTextField({
  form,
  name,
  label,
  placeholder,
  required,
  onlyNumber,
  uppercase,
  maxLength,
  inputMode,
  formatCurrencyVnd: shouldFormatCurrencyVnd,
  onAfterChange,
  autoFilled,
}: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const fieldValue = typeof field.value === "string" ? field.value : "";

        return (
          <FormItem>
            <FormLabel>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>

            <FormControl>
              <Input
                name={field.name}
                ref={field.ref}
                value={fieldValue}
                placeholder={placeholder}
                maxLength={maxLength}
                inputMode={inputMode}
                onBlur={(event) => {
                  const trimmedValue = event.target.value.trim();

                  if (trimmedValue !== event.target.value) {
                    field.onChange(trimmedValue);
                    onAfterChange?.(trimmedValue);
                  }

                  field.onBlur();
                }}
                onChange={(event) => {
                  let nextValue = event.target.value;

                  if (shouldFormatCurrencyVnd) {
                    const formattedValue = formatCurrencyInput(nextValue);

                    field.onChange(formattedValue);
                    onAfterChange?.(formattedValue);
                    return;
                  }

                  if (onlyNumber) {
                    nextValue = nextValue.replace(/\D/g, "");
                  }

                  if (uppercase) {
                    nextValue = nextValue.toUpperCase();
                  }

                  field.onChange(nextValue);
                  onAfterChange?.(nextValue);
                }}
                className={[
                  "h-12 rounded-xl border border-[#dbe5dd] bg-white px-4 text-base text-[#111827] shadow-sm transition-colors placeholder:text-[#94a3b8] focus-visible:ring-1 focus-visible:ring-[#009b3a]",
                  autoFilled ? "border-[#b7e4c7] bg-[#e8f8ee]" : "",
                ].join(" ")}
              />
            </FormControl>

            <FormMessage className="text-red-500" />
          </FormItem>
        );
      }}
    />
  );
}

type SelectFieldProps = FieldProps & {
  options: ReferenceOption[];
  disabled?: boolean;
  onAfterChange?: (value: string) => void;
};

export function CustomerAssetSelectField({
  form,
  name,
  label,
  placeholder,
  options,
  required,
  disabled,
  onAfterChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>

          <Select
            open={open}
            onOpenChange={setOpen}
            value={(field.value as string) || ""}
            disabled={disabled}
            onValueChange={(value) => {
              field.onChange(value);
              onAfterChange?.(value);
              setOpen(false);
            }}
          >
            <FormControl>
              <SelectTrigger className="h-12 rounded-xl border border-[#dbe5dd] bg-white text-[#111827] shadow-sm data-[placeholder]:text-[#94a3b8] disabled:bg-[#f8fbf8] disabled:text-[#94a3b8] disabled:opacity-70">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>

            <SelectContent
              position="popper"
              sideOffset={6}
              className="z-[9999] max-h-[260px] rounded-xl border border-[#dbe5dd] bg-white p-1 text-[#111827] shadow-xl"
            >
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[#94a3b8]">
                  Không có dữ liệu
                </div>
              ) : (
                options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer rounded-lg bg-white text-[#111827] focus:bg-[#ecfdf3] focus:text-[#009b3a] data-[state=checked]:bg-[#e9f8ee] data-[state=checked]:text-[#009b3a]"
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
}

type DateFieldProps = FieldProps & {
  autoFilled?: boolean;
  maxYear?: number;
};

export function CustomerAssetDateField({
  form,
  name,
  label,
  required,
  placeholder,
  autoFilled,
  maxYear = new Date().getFullYear(),
}: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>

          <FormControl>
            <AppDatePicker
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              placeholder={placeholder || "Chọn ngày"}
              autoFilled={autoFilled}
              maxYear={maxYear}
              disabledDate={(date) => date > new Date()}
            />
          </FormControl>

          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
}

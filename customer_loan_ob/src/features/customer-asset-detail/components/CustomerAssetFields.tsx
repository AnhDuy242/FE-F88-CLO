import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
};

function formatCurrencyVnd(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) return "";

  return digitsOnly.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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
                onBlur={field.onBlur}
                onChange={(event) => {
                  let nextValue = event.target.value;

                  if (shouldFormatCurrencyVnd) {
                    field.onChange(formatCurrencyVnd(nextValue));
                    return;
                  }

                  if (onlyNumber) {
                    nextValue = nextValue.replace(/\D/g, "");
                  }

                  if (uppercase) {
                    nextValue = nextValue.toUpperCase();
                  }

                  field.onChange(nextValue);
                }}
                className="h-12 rounded-xl border border-[#dbe5dd] bg-white px-4 text-base text-[#111827] shadow-sm placeholder:text-[#94a3b8] focus-visible:ring-1 focus-visible:ring-[#009b3a]"
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

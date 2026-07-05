import type { InputHTMLAttributes } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { formatCurrencyInput } from "@/lib/currency";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { PreliminaryInfoFormValues } from "../schemas/preliminary-info.schema";

type TextInputFieldProps = {
  form: UseFormReturn<PreliminaryInfoFormValues>;
  name: FieldPath<PreliminaryInfoFormValues>;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onlyNumber?: boolean;
  uppercase?: boolean;
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  formatCurrencyVnd?: boolean;
  autoFilled?: boolean;
};

export function TextInputField({
  form,
  name,
  label,
  placeholder,
  required,
  className,
  onlyNumber,
  uppercase,
  maxLength,
  inputMode,
  formatCurrencyVnd: shouldFormatCurrencyVnd,
  autoFilled,
}: TextInputFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const fieldValue =
          typeof field.value === "string" ? field.value : "";

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
                  }

                  field.onBlur();
                }}
                onChange={(event) => {
                  let nextValue = event.target.value;

                  if (shouldFormatCurrencyVnd) {
                    field.onChange(formatCurrencyInput(nextValue));
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
                className={[
                  "h-12 rounded-xl border border-[#dbe5dd] bg-white px-4 text-base text-[#111827] shadow-sm placeholder:text-[#94a3b8] focus-visible:ring-1 focus-visible:ring-[#009b3a]",
                  autoFilled
                    ? "border-[#b7e4c7] bg-[#e8f8ee]"
                    : "",
                  className,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </FormControl>

            <FormMessage className="text-red-500" />
          </FormItem>
        );
      }}
    />
  );
}

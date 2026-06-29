import { useState } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";

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

import type { PreliminaryInfoFormValues } from "../schemas/preliminary-info.schema";

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  form: UseFormReturn<PreliminaryInfoFormValues>;
  name: FieldPath<PreliminaryInfoFormValues>;
  label: string;
  placeholder: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
};

export function SelectField({
  form,
  name,
  label,
  placeholder,
  options,
  required,
  disabled,
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
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer rounded-lg bg-white text-[#111827] focus:bg-[#ecfdf3] focus:text-[#009b3a] data-[state=checked]:bg-[#e9f8ee] data-[state=checked]:text-[#009b3a]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
}
import type { FieldPath, UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";

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
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  onlyNumber?: boolean;
  uppercase?: boolean;
};

export function TextInputField({
  form,
  name,
  label,
  placeholder,
  required,
  className = "bg-white",
  inputMode,
  maxLength,
  onlyNumber,
  uppercase,
}: TextInputFieldProps) {
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
            <Input
              placeholder={placeholder}
              inputMode={inputMode}
              maxLength={maxLength}
              className={`h-12 rounded-xl ${className}`}
              value={(field.value as string) || ""}
              onChange={(event) => {
                let value = event.target.value;

                if (onlyNumber) {
                  value = value.replace(/\D/g, "");
                }

                if (uppercase) {
                  value = value.toUpperCase();
                }

                field.onChange(value);
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>

          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
}
import type { UseFormReturn } from "react-hook-form";

import { AppDatePicker } from "@/components/shared/AppDatePicker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { PreliminaryInfoFormValues } from "../schemas/preliminary-info.schema";

type DateOfBirthFieldProps = {
  form: UseFormReturn<PreliminaryInfoFormValues>;
  autoFilled?: boolean;
};

export function DateOfBirthField({ form, autoFilled }: DateOfBirthFieldProps) {
  return (
    <FormField
      control={form.control}
      name="dateOfBirth"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Ngày sinh</FormLabel>
          <FormControl>
            <AppDatePicker
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="Chọn ngày sinh"
              autoFilled={autoFilled}
              maxYear={new Date().getFullYear()}
              disabledDate={(date) => date > new Date()}
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
}

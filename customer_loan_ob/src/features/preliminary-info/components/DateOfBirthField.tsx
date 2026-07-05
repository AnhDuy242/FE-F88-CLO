import type { UseFormReturn } from "react-hook-form";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      render={({ field }) => {
        const parsedDate = field.value
          ? parse(field.value, "yyyy-MM-dd", new Date())
          : undefined;

        const selectedDate =
          parsedDate && isValid(parsedDate) ? parsedDate : undefined;

        return (
          <FormItem>
            <FormLabel>Ngày sinh</FormLabel>

            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={[
                      "h-12 w-full justify-between rounded-xl border px-4 text-left transition-colors",
                      selectedDate
                        ? "border-[#dbe5dd] bg-white font-normal text-[#111827]"
                        : "border-[#dbe5dd] bg-white font-normal text-[#94a3b8]",
                      autoFilled && selectedDate
                        ? "border-[#b7e4c7] bg-[#f2fbf5] font-semibold"
                        : "",
                    ].join(" ")}
                  >
                    <span>
                      {selectedDate
                        ? format(selectedDate, "dd/MM/yyyy")
                        : "Chọn ngày sinh"}
                    </span>

                    <CalendarIcon
                      size={18}
                      color="currentColor"
                      variant="Outline"
                    />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                sideOffset={8}
                className="z-[9999] w-auto rounded-xl border border-[#dbe5dd] bg-white p-0 shadow-xl"
              >
                <div className="rounded-xl bg-white p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    className="rounded-lg bg-white"
                  />
                </div>
              </PopoverContent>
            </Popover>

            <FormMessage className="text-red-500" />
          </FormItem>
        );
      }}
    />
  );
}

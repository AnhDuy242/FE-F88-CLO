import { forwardRef, useRef } from "react";
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";

import { Input } from "@/components/ui/input";
import { formatMoneyInput, onlyDigits } from "@/lib/currency";

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value?: string | number | null;
  onValueChange?: (rawDigits: string) => void;
};

function setInputRef(
  ref: Ref<HTMLInputElement> | undefined,
  element: HTMLInputElement | null,
) {
  if (!ref) return;

  if (typeof ref === "function") {
    ref(element);
    return;
  }

  ref.current = element;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, inputMode = "numeric", ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const displayValue = formatMoneyInput(value);

    const moveCaretToEnd = () => {
      window.requestAnimationFrame(() => {
        const input = inputRef.current;

        if (!input || document.activeElement !== input) return;

        const endPosition = input.value.length;
        input.setSelectionRange(endPosition, endPosition);
      });
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const rawDigits = onlyDigits(event.target.value);

      onValueChange?.(rawDigits);
      moveCaretToEnd();
    };

    return (
      <Input
        {...props}
        ref={(element) => {
          inputRef.current = element;
          setInputRef(ref, element);
        }}
        value={displayValue}
        inputMode={inputMode}
        onChange={handleChange}
        onFocus={(event) => {
          props.onFocus?.(event);
          moveCaretToEnd();
        }}
        onMouseUp={(event) => {
          props.onMouseUp?.(event);
          moveCaretToEnd();
        }}
        onKeyUp={(event) => {
          props.onKeyUp?.(event);
          moveCaretToEnd();
        }}
      />
    );
  },
);

MoneyInput.displayName = "MoneyInput";

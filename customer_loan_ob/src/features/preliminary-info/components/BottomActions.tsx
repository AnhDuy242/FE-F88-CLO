import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

import { Button } from "@/components/ui/button";

type BottomActionsProps = {
  isSubmitting?: boolean;
  onBack: () => void;
};

export function BottomActions({ isSubmitting, onBack }: BottomActionsProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-8 mt-8 flex items-center justify-end border-t bg-white px-8 py-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 gap-2 rounded-xl bg-white px-8 font-bold shadow-sm"
        >
          <ArrowLeft2 size={18} color="currentColor" variant="Outline" />
          Quay lại
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 gap-2 rounded-xl bg-[#009b3a] px-8 font-bold text-white hover:bg-[#008232]"
        >
          {isSubmitting ? "Đang xử lý..." : "Tiếp tục"}
          <ArrowRight2 size={18} color="currentColor" variant="Outline" />
        </Button>
      </div>
    </div>
  );
}

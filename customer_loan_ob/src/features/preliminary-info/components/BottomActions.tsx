import {
  ArrowLeft2,
  ArrowRight2,
  CloseCircle,
  Save2,
} from "iconsax-react";

import { Button } from "@/components/ui/button";

type BottomActionsProps = {
  isSubmitting?: boolean;
  onSaveDraft: () => void;
  onCancel: () => void;
  onBack: () => void;
};

export function BottomActions({
  isSubmitting,
  onSaveDraft,
  onCancel,
  onBack,
}: BottomActionsProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-8 mt-8 flex items-center justify-between border-t bg-white px-8 py-4">
      <div className="flex items-center gap-6">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          className="h-11 gap-2 rounded-xl bg-white px-6 font-bold shadow-sm"
        >
          <Save2 size={18} color="currentColor" variant="Outline" />
          Lưu nháp
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-11 gap-2 rounded-xl px-4 font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <CloseCircle size={18} color="currentColor" variant="Outline" />
          Huỷ hồ sơ
        </Button>
      </div>

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
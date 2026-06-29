import { CloudAdd, Gallery, Trash } from "iconsax-react";
import { Button } from "@/components/ui/button";

import type {
  UploadedImage,
  UploadSide,
} from "../types/customer-identify.type";

type CCCDUploadBoxProps = {
  title: string;
  description: string;
  image: UploadedImage | null;
  side: UploadSide;
  onUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    side: UploadSide
  ) => void;
  onRemove: (side: UploadSide) => void;
};

export function CCCDUploadBox({
  title,
  description,
  image,
  side,
  onUpload,
  onRemove,
}: CCCDUploadBoxProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
        <p className="mt-1 text-sm text-[#6b7280]">{description}</p>
      </div>

      {!image ? (
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#9dd9ad] bg-[#fbfffc] px-4 py-6 text-center transition hover:bg-[#f0fff4]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => onUpload(event, side)}
          />

          <CloudAdd
            size={42}
            color="#009b3a"
            variant="Outline"
            className="mb-3"
          />

          <p className="text-sm font-semibold text-[#374151]">
            Kéo thả hoặc bấm để upload ảnh
          </p>

          <p className="mt-2 text-xs text-[#6b7280]">
            Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB
          </p>
        </label>
      ) : (
        <div className="rounded-xl border border-[#dbe5dd] bg-white p-3">
          <div className="relative overflow-hidden rounded-lg border bg-[#f8fafc]">
            <img
              src={image.previewUrl}
              alt={title}
              className="h-[190px] w-full object-contain bg-[#f8fafc]"
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Gallery
                size={18}
                color="#009b3a"
                variant="Outline"
                className="shrink-0"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#111827]">
                  {image.file.name}
                </p>

                <p className="text-xs text-[#6b7280]">
                  {(image.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(side)}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash size={18} color="#ef4444" variant="Outline" />
            </Button>
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#9dd9ad] py-2 text-sm font-medium text-[#009b3a] hover:bg-[#f0fff4]">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => onUpload(event, side)}
            />
            Đổi ảnh khác
          </label>
        </div>
      )}
    </div>
  );
}
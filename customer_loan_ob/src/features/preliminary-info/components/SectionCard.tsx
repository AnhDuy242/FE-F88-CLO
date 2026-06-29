import { useState, type ReactNode } from "react";
import { ArrowRight2 } from "iconsax-react";

import { Card, CardContent } from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  icon: ReactNode;
  iconClassName: string;
  rightContent?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  icon,
  iconClassName,
  rightContent,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="overflow-hidden rounded-2xl border border-[#dbe5dd] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-7 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClassName}`}
          >
            {icon}
          </div>

          <h2 className="text-xl font-bold text-[#111827]">{title}</h2>
        </div>

        <div className="flex items-center gap-5">
          {rightContent}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-full p-1 hover:bg-[#f1f5f9]"
          >
            <ArrowRight2
              size={18}
              color="#475569"
              variant="Outline"
              className={open ? "-rotate-90 transition" : "rotate-90 transition"}
            />
          </button>
        </div>
      </div>

      {open && <CardContent className="p-7">{children}</CardContent>}
    </Card>
  );
}
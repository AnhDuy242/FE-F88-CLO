import { Link } from "@tanstack/react-router";
import { ArrowRight2, Home2 } from "iconsax-react";

type CustomerIdentifyBreadcrumbProps = {
  currentStep: number;
};

const steps = [
  {
    step: 1,
    title: "Định danh khách hàng",
  },
  {
    step: 2,
    title: "Thông tin sơ bộ gói vay",
  },
  {
    step: 3,
    title: "Chi tiết khách hàng",
  },
  {
    step: 4,
    title: "Chi tiết tài sản",
  },
  {
    step: 5,
    title: "Đề xuất gói vay cuối cùng",
  },
  {
    step: 6,
    title: "Upload hồ sơ & Hoàn tất",
  },
];

export function CustomerIdentifyBreadcrumb({
  currentStep,
}: CustomerIdentifyBreadcrumbProps) {
  const currentStepData = steps.find((item) => item.step === currentStep);

  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm">
      <Link
        to="/"
        className="flex items-center gap-1 font-medium text-[#64748b] hover:text-[#009b3a]"
      >
        <Home2 size={16} color="currentColor" variant="Outline" />
        Trang chủ
      </Link>

      <ArrowRight2 size={14} color="#94a3b8" variant="Outline" />

      <Link
        to="/loan/customer-identify"
        className="font-medium text-[#64748b] hover:text-[#009b3a]"
      >
        Hồ sơ vay
      </Link>

      <ArrowRight2 size={14} color="#94a3b8" variant="Outline" />

      <span className="font-medium text-[#64748b]">Tạo hồ sơ vay</span>

      <ArrowRight2 size={14} color="#94a3b8" variant="Outline" />

      <span className="font-bold text-[#009b3a]">
        Bước {currentStep}: {currentStepData?.title}
      </span>
    </nav>
  );
}
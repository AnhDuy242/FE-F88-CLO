type LoanOnboardingStepperProps = {
  currentStep: number;
};

const steps = [
  "Định danh khách hàng",
  "Thông tin sơ bộ Gói vay",
  "Chi tiết khách hàng",
  "Chi tiết tài sản",
  "Đề xuất gói vay cuối cùng",
  "Upload hồ sơ & Hoàn tất",
];

export function LoanOnboardingStepper({
  currentStep,
}: LoanOnboardingStepperProps) {
  return (
    <div className="mb-7 flex items-start justify-center">
      <div className="flex w-full max-w-[980px] items-start justify-between">
        {steps.map((item, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div
              key={item}
              className="relative flex flex-1 flex-col items-center"
            >
              {index !== 0 && (
                <div
                  className={
                    isCompleted || isActive
                      ? "absolute left-[-50%] top-5 h-px w-full bg-[#009b3a]"
                      : "absolute left-[-50%] top-5 h-px w-full bg-[#cbd5e1]"
                  }
                />
              )}

              <div
                className={
                  isActive
                    ? "z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#009b3a] text-base font-bold text-white"
                    : isCompleted
                      ? "z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#dcfce7] text-base font-bold text-[#009b3a]"
                      : "z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#cbd5e1] bg-white text-base font-bold text-[#334155]"
                }
              >
                {step}
              </div>

              <p
                className={
                  isActive
                    ? "mt-3 max-w-[120px] text-center text-sm font-bold leading-5 text-[#009b3a]"
                    : "mt-3 max-w-[120px] text-center text-sm font-medium leading-5 text-[#475569]"
                }
              >
                {item}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
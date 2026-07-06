import type { CustomerRiskScoringData } from "@/features/customer-asset-detail/types/customer-risk-scoring.type";

type CustomerRiskScoringSectionProps = {
  scoring: CustomerRiskScoringData | null;
};

const scoreGrades = ["A", "B", "C", "D", "E"] as const;

function normalizeGrade(value?: string) {
  return (value || "").trim().toUpperCase();
}

export function CustomerRiskScoringSection({
  scoring,
}: CustomerRiskScoringSectionProps) {
  const activeGrade = normalizeGrade(scoring?.grade);

  return (
    <section className="rounded-xl border border-[#dbe5dd] bg-white p-4 transition-all duration-200 hover:border-[#b7e4c7] hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#111827]">
            Scoring — Điểm rủi ro khách hàng
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#64748b]">
            Điểm đánh giá rủi ro được lấy từ dữ liệu scoring backend.
          </p>
        </div>

        {scoring?.score !== undefined && (
          <div className="shrink-0 rounded-full border border-[#b7e4c7] bg-[#ecfdf3] px-3 py-1 text-sm font-bold text-[#009b3a]">
            {scoring.score}/100
          </div>
        )}
      </div>

      {!scoring ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fbf8] px-4 py-5 text-sm font-medium text-[#64748b]">
          Chưa có dữ liệu scoring từ backend.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {scoreGrades.map((grade) => {
              const isActive = activeGrade === grade;

              return (
                <div
                  key={grade}
                  className={
                    isActive
                      ? "rounded-xl border border-[#009b3a] bg-[#ecfdf3] px-2 py-3 text-center text-sm font-bold text-[#009b3a] shadow-sm"
                      : "rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] px-2 py-3 text-center text-sm font-bold text-[#94a3b8]"
                  }
                >
                  {grade}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-[#64748b]">
            <span>Rủi ro thấp</span>
            <span>Rủi ro cao</span>
          </div>

          {(scoring.grade || scoring.riskLevel || scoring.description) && (
            <div className="rounded-xl border border-[#dbe5dd] bg-[#f8fbf8] p-3 text-sm">
              {scoring.grade && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#64748b]">Hạng</span>
                  <span className="font-bold text-[#111827]">
                    {scoring.grade}
                  </span>
                </div>
              )}

              {scoring.riskLevel && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[#64748b]">Mức rủi ro</span>
                  <span className="font-bold text-[#111827]">
                    {scoring.riskLevel}
                  </span>
                </div>
              )}

              {scoring.description && (
                <p className="mt-3 leading-5 text-[#475569]">
                  {scoring.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

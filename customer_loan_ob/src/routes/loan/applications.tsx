import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/loan/applications")({
  component: LoanApplicationsScreen,
});

function LoanApplicationsScreen() {
  return (
    <div className="min-h-screen bg-[#f6faf5] px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Hồ sơ vay</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Danh sách hồ sơ vay đã hoàn chỉnh hoặc không còn ở trạng thái nháp.
        </p>
      </div>

      <Card className="rounded-xl border border-[#dbe5dd] bg-white shadow-none">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e9f8ee]">
            <FileText className="h-7 w-7 text-[#009b3a]" />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Chưa có API danh sách hồ sơ vay
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b7280]">
            Backend hiện chỉ có API lấy chi tiết hồ sơ theo mã
            <span className="font-medium text-[#111827]">
              {" "}
              GET /api/v1/loan-applications/{"{applicationCode}"}
            </span>
            , chưa có API danh sách hồ sơ vay đã hoàn chỉnh hoặc trạng thái
            không phải draft. Vì vậy màn này chưa hiển thị bảng dữ liệu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

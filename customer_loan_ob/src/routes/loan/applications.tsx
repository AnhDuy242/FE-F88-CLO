import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Eye, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { axiosClient } from "@/lib/axios-client";

export const Route = createFileRoute("/loan/applications")({
  component: LoanApplicationsScreen,
});

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type LoanApplicationListItem = {
  applicationCode: string;
  applicationState: string;
  applicationStateName?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  phoneNumber?: string | null;
  identityNumber?: string | null;
  requestedAmount?: number | string | null;
  loanTermMonths?: number | null;
  loanPurposeName?: string | null;
  loanProductName?: string | null;
  branch?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Chưa có";

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "Chưa có";

  const amount = Number(value);
  if (Number.isNaN(amount)) return "Chưa có";

  return amount.toLocaleString("vi-VN") + " đ";
}

function stateVariant(state?: string) {
  if (state === "APP_SUBMITTED" || state === "APP_IN_REVIEW") return "default";
  if (state === "APP_CANCELLED" || state === "APP_EXPIRED") return "destructive";
  return "secondary";
}

async function fetchLoanApplications() {
  return axiosClient.get<
    ApiResponse<LoanApplicationListItem[]>,
    ApiResponse<LoanApplicationListItem[]>
  >(API_ENDPOINTS.loanApplication.list);
}

function LoanApplicationsScreen() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [applications, setApplications] = useState<LoanApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadApplications() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchLoanApplications();
      setApplications(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không tải được danh sách hồ sơ vay.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  if (pathname !== "/loan/applications") {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#f6faf5] px-8 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Hồ sơ vay</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Danh sách hồ sơ vay đã hoàn chỉnh hoặc không còn ở trạng thái nháp.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => void loadApplications()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </Button>
      </div>

      <Card className="rounded-xl border border-[#dbe5dd] bg-white shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-red-600">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void loadApplications()}
              >
                Thử lại
              </Button>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e9f8ee]">
                <FileText className="h-7 w-7 text-[#009b3a]" />
              </div>

              <h2 className="text-lg font-bold text-[#111827]">
                Chưa có hồ sơ vay
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b7280]">
                Hệ thống chưa có hồ sơ nào đã gửi duyệt hoặc ra khỏi luồng nháp.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hồ sơ</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Số tiền vay</TableHead>
                  <TableHead>Kỳ hạn</TableHead>
                  <TableHead>Gói vay</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.applicationCode}>
                    <TableCell className="font-semibold text-[#111827]">
                      {application.applicationCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#111827]">
                        {application.customerName || "Chưa có"}
                      </div>
                      <div className="text-xs text-[#6b7280]">
                        {application.customerCode || "Chưa có mã KH"}
                      </div>
                    </TableCell>
                    <TableCell>{application.phoneNumber || "Chưa có"}</TableCell>
                    <TableCell>{formatCurrency(application.requestedAmount)}</TableCell>
                    <TableCell>
                      {application.loanTermMonths
                        ? `${application.loanTermMonths} tháng`
                        : "Chưa có"}
                    </TableCell>
                    <TableCell>
                      {application.loanProductName ||
                        application.loanPurposeName ||
                        "Chưa có"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stateVariant(application.applicationState)}>
                        {application.applicationStateName ||
                          application.applicationState}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(application.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-[#009b3a] text-[#009b3a] hover:bg-[#ecfdf3] hover:text-[#009b3a]"
                        onClick={() =>
                          navigate({
                            to: "/loan/applications/$applicationCode",
                            params: { applicationCode: application.applicationCode },
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

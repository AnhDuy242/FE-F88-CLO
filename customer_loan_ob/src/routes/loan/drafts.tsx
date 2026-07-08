import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

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
import { toast } from "@/components/ui/toast";
import {
  loanApplicationDraftApi,
  type LoanApplicationDraftSummary,
} from "@/features/loan-onboarding/api/loan-application-draft.api";
import { useLoanOnboardingStore } from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import {
  mapDraftDetailToOnboardingState,
  type ResumeRoute,
} from "@/features/loan-onboarding/utils/draft-resume.mapper";

export const Route = createFileRoute("/loan/drafts")({
  component: LoanDraftsScreen,
});

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Chưa có";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status?: string) {
  if (status === "APP_CREATED") return "Mới tạo";
  if (status === "APP_IN_PROGRESS") return "Đang hoàn thiện";
  if (status === "APP_COMPLETED") return "Đã hoàn thiện";
  if (status === "APP_SUBMITTED") return "Đã nộp hồ sơ";
  if (status === "APP_CANCELLED") return "Đã hủy";
  if (status === "APP_EXPIRED") return "Hết hạn";
  if (status === "DRAFT") return "Đang nháp";
  if (status === "COMPLETED") return "Đã hoàn tất nháp";
  if (status === "CONVERTED") return "Đã tạo hồ sơ vay";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "EXPIRED") return "Hết hạn";
  return status || "Chưa xác định";
}

function navigateToResumeRoute(
  navigate: ReturnType<typeof useNavigate>,
  route: ResumeRoute,
) {
  if (route === "/loan/preliminary-info") {
    navigate({ to: "/loan/preliminary-info" });
    return;
  }

  if (route === "/loan/customer-asset-detail") {
    navigate({ to: "/loan/customer-asset-detail" });
    return;
  }

  if (route === "/loan/upload-documents") {
    navigate({ to: "/loan/upload-documents" });
    return;
  }

  navigate({ to: "/loan/customer-identify" });
}

function applyDraftToStore(draftCode: string) {
  return async () => {
    const detailResponse = await loanApplicationDraftApi.getOverview(draftCode);

    if (!detailResponse.success || !detailResponse.data) {
      throw new Error(
        detailResponse.message || "Không lấy được chi tiết hồ sơ vay nháp.",
      );
    }

    const mappedState = mapDraftDetailToOnboardingState(detailResponse.data);
    const store = useLoanOnboardingStore.getState();

    store.resetLoanOnboarding();

    const nextStore = useLoanOnboardingStore.getState();

    if (mappedState.applicationCode) {
      nextStore.setApplicationCode(mappedState.applicationCode);
    }

    nextStore.setDraftInfo(mappedState.draftInfo);
    nextStore.setCurrentStep(mappedState.currentStep);
    nextStore.setSelectedCustomer(mappedState.selectedCustomer);
    nextStore.setCustomerIdentifyData(mappedState.customerIdentifyData);
    nextStore.setOcrData(mappedState.ocrData);
    nextStore.setPhoneNumber(mappedState.phoneNumber);
    nextStore.setStep1CustomerIdentify(mappedState.step1CustomerIdentify);
    nextStore.setStep2PreliminaryInfo(mappedState.step2PreliminaryInfo);
    nextStore.setLoanRecommendation(mappedState.loanRecommendation);
    nextStore.setSelectedLoanProduct(mappedState.selectedLoanProduct);

    if (mappedState.customerAssetDetailData) {
      nextStore.setCustomerAssetDetailData(mappedState.customerAssetDetailData);
    }

    if (mappedState.assetData) {
      nextStore.setAssetData(mappedState.assetData);
    }

    if (mappedState.references.length > 0) {
      nextStore.setReferences(mappedState.references);
    }

    return mappedState.route;
  };
}

function LoanDraftsScreen() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<LoanApplicationDraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resumingDraftCode, setResumingDraftCode] = useState("");
  const onboardingStates = new Set(["APP_CREATED", "APP_IN_PROGRESS", "APP_COMPLETED"]);

  const loadDrafts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await loanApplicationDraftApi.list();

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Không lấy được danh sách hồ sơ vay nháp.",
        );
      }

      setDrafts(
        response.data.filter(
          (draft) =>
            draft.applicationState && onboardingStates.has(draft.applicationState),
        ),
      );
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message || "")
          : "";

      setDrafts([]);
      setErrorMessage(
        message || "Không thể tải danh sách hồ sơ vay nháp. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDrafts();
  }, []);

  const handleResumeDraft = async (draftCode: string) => {
    setResumingDraftCode(draftCode);

    try {
      const route = await applyDraftToStore(draftCode)();

      toast.success("Đã khôi phục hồ sơ vay nháp.");
      navigateToResumeRoute(navigate, route);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message || "")
          : "";

      toast.error(message || "Không thể mở hồ sơ vay nháp.");
    } finally {
      setResumingDraftCode("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf5] px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Hồ sơ vay nháp</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Danh sách hồ sơ đang được lưu nháp trong hệ thống.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadDrafts}
          disabled={isLoading}
          className="border-[#009b3a] text-[#009b3a] hover:bg-[#ecfdf3] hover:text-[#009b3a]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại
        </Button>
      </div>

      <Card className="rounded-xl border border-[#dbe5dd] bg-white shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <FileText className="mb-3 h-12 w-12 text-red-300" />
              <p className="font-semibold text-[#111827]">Không tải được dữ liệu</p>
              <p className="mt-2 max-w-md text-sm text-[#6b7280]">
                {errorMessage}
              </p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <CalendarClock className="mb-3 h-12 w-12 text-[#b7e4c7]" />
              <p className="font-semibold text-[#111827]">Chưa có hồ sơ nháp</p>
              <p className="mt-2 max-w-md text-sm text-[#6b7280]">
                Khi có hồ sơ vay nháp từ backend, danh sách sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã nháp</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Bước hiện tại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {drafts.map((draft) => (
                  <TableRow
                    key={draft.draftCode}
                    className="cursor-pointer"
                    onClick={() => handleResumeDraft(draft.draftCode)}
                  >
                    <TableCell className="font-semibold text-[#111827]">
                      {draft.draftCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#111827]">
                          {draft.customerName || "Chưa có"}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {draft.customerCode || "Chưa có mã KH"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{draft.phoneNumber || "Chưa có"}</TableCell>
                    <TableCell>
                      {draft.currentStepName || draft.currentStepCode || "Chưa có"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#b7e4c7] bg-[#e8f8ee] text-[#008232]"
                      >
                        {statusLabel(draft.applicationState || draft.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(draft.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        disabled={resumingDraftCode === draft.draftCode}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleResumeDraft(draft.draftCode);
                        }}
                        className="bg-[#009b3a] text-white hover:bg-[#008232]"
                      >
                        {resumingDraftCode === draft.draftCode
                          ? "Đang mở..."
                          : "Mở hồ sơ"}
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

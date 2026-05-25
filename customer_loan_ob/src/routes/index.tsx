// Import hàm tạo route của TanStack Router
import { createFileRoute } from "@tanstack/react-router"

// Import icon dùng trực tiếp trong màn Home
import { ChevronRight } from "lucide-react"

// Import component UI từ shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Import mock data đã tách riêng
import {
  overviewStats,
  quickActions,
  recentLoans,
} from "@/mockdata/home.mock"

// Khai báo route "/" tương ứng với trang Home
export const Route = createFileRoute("/")({
  component: HomeScreen,
})

function HomeScreen() {
  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* ================= MAIN CONTENT ================= */}
      <main className="space-y-6 px-6 py-5">
        {/* ================= WELCOME SECTION ================= */}
        <section>
          <h1 className="text-2xl font-bold text-black">
            Xin chào, Nguyễn Thị Lan
          </h1>

          <p className="mt-1.5 text-base text-gray-600">
            Chào mừng bạn quay lại. Đây là tổng quan hoạt động hôm nay.
          </p>
        </section>

        {/* ================= OVERVIEW STATS SECTION ================= */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((item) => {
            const Icon = item.icon
            const TrendIcon = item.trendIcon
            const isUpTrend = item.trend === "up"

            return (
              <Card
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <CardContent className="flex items-start justify-between p-4">
                  {/* Nội dung bên trái của card */}
                  <div>
                    <p className="text-sm text-gray-600">{item.title}</p>

                    <h2 className="mt-2 text-2xl font-bold text-black">
                      {item.value}
                    </h2>

                    <div
                      className={[
                        "mt-3 flex items-center gap-1 text-xs",
                        isUpTrend ? "text-[#009b3a]" : "text-red-500",
                      ].join(" ")}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      <span>{item.description}</span>
                    </div>
                  </div>

                  {/* Icon bên phải của card */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dff3e5]">
                    <Icon className="h-5 w-5 text-[#009b3a]" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* ================= QUICK ACTIONS SECTION ================= */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-black">
            Thao tác nhanh
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((item) => {
              const Icon = item.icon

              return (
                <Card
                  key={item.title}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-5">
                    {/* Icon thao tác */}
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff3e5]">
                      <Icon className="h-6 w-6 text-[#009b3a]" />
                    </div>

                    {/* Tên thao tác */}
                    <h3 className="text-lg font-bold text-black">
                      {item.title}
                    </h3>

                    {/* Mô tả thao tác */}
                    <p className="mt-2 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* ================= RECENT LOANS SECTION ================= */}
        <section>
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-5">
              {/* Header của box Hồ sơ gần đây */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">
                  Hồ sơ gần đây
                </h2>

                {/* Nút xem tất cả */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm text-[#009b3a] hover:bg-green-50 hover:text-[#007f31]"
                >
                  Xem tất cả
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Danh sách hồ sơ */}
              <div className="space-y-4">
                {recentLoans.map((loan) => {
                  let statusClassName = ""

                  if (loan.status === "Đã duyệt") {
                    statusClassName = "bg-[#dff3e5] text-[#009b3a]"
                  } else if (loan.status === "Chờ xử lý") {
                    statusClassName = "bg-yellow-100 text-yellow-700"
                  } else {
                    statusClassName = "bg-orange-100 text-orange-700"
                  }

                  return (
                    <div
                      key={loan.loanCode}
                      className="flex items-center justify-between border-b border-[#e5ece7] pb-4 last:border-b-0 last:pb-0"
                    >
                      {/* Thông tin khách hàng bên trái */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3e5] text-sm font-semibold text-[#009b3a]">
                          {loan.avatar}
                        </div>

                        {/* Tên khách hàng và mã hồ sơ */}
                        <div>
                          <h3 className="text-base font-bold text-black">
                            {loan.customerName}
                          </h3>

                          <p className="mt-0.5 text-sm text-gray-600">
                            {loan.loanCode}
                          </p>
                        </div>
                      </div>

                      {/* Thông tin khoản vay bên phải */}
                      <div className="text-right">
                        {/* Số tiền vay */}
                        <p className="text-base font-bold text-black">
                          {loan.amount}
                        </p>

                        <div className="mt-1 flex items-center justify-end gap-2">
                          {/* Thời gian cập nhật */}
                          <span className="text-xs text-gray-600">
                            {loan.time}
                          </span>

                          {/* Badge trạng thái */}
                          <span
                            className={[
                              "inline-flex min-w-[92px] justify-center rounded-full px-3 py-1 text-xs font-semibold",
                              statusClassName,
                            ].join(" ")}
                          >
                            {loan.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
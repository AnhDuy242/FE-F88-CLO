import { createFileRoute } from "@tanstack/react-router"
import { MapPinIcon, Phone, Search, UserCircle } from "lucide-react"

import { customers } from "@/mockdata/customer.mock"

export const Route = createFileRoute("/customer")({
  component: CustomerPage,
})

function CustomerPage() {
  return (
    <div className="min-h-screen bg-[#f7faf6] text-black transition-colors duration-300 dark:bg-background dark:text-foreground">
      {/* ================= MAIN CONTENT ================= */}
      <main className="px-6 py-6">
        {/* ================= PAGE TITLE ================= */}
        <section>
          <h1 className="text-2xl font-bold text-black dark:text-foreground">
            Khách hàng
          </h1>

          <p className="mt-2 text-base text-gray-600 dark:text-muted-foreground">
            Quản lý danh sách khách hàng
          </p>
        </section>

        {/* ================= SEARCH BOX ================= */}
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-border dark:bg-card">
          <div className="flex h-11 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 shadow-sm transition-colors duration-300 dark:border-input dark:bg-background">
            <Search className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />

            <input
              type="text"
              placeholder="Tìm theo họ tên, ngày sinh, CCCD, SĐT..."
              className="h-full flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-500 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* ================= CUSTOMER TABLE ================= */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-border dark:bg-card">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#f1f7f2] text-center text-xs font-semibold uppercase text-gray-700 transition-colors duration-300 dark:bg-muted dark:text-muted-foreground">
                  <th className="whitespace-nowrap px-4 py-3">Mã KH</th>
                  <th className="whitespace-nowrap px-4 py-3">Họ tên</th>
                  <th className="whitespace-nowrap px-4 py-3">Ngày sinh</th>
                  <th className="whitespace-nowrap px-4 py-3">CCCD</th>
                  <th className="whitespace-nowrap px-4 py-3">SĐT</th>
                  <th className="whitespace-nowrap px-4 py-3">Địa chỉ</th>
                  <th className="whitespace-nowrap px-4 py-3">Số hồ sơ</th>
                  <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  let statusClassName = ""

                  if (customer.status === "Đang hoạt động") {
                    statusClassName =
                      "border-green-200 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
                  } else if (customer.status === "Hạn chế") {
                    statusClassName =
                      "border-red-200 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                  } else {
                    statusClassName =
                      "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-500/30 dark:bg-gray-500/15 dark:text-gray-300"
                  }

                  return (
                    <tr
                      key={customer.customerCode}
                      className="border-b border-[#d8e2dc] text-gray-700 transition-colors duration-300 hover:bg-gray-50 dark:border-border dark:text-muted-foreground dark:hover:bg-muted/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#009b3a] dark:text-primary">
                        {customer.customerCode}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />

                          <span className="font-semibold text-black dark:text-foreground">
                            {customer.fullName}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {customer.dateOfBirth}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {customer.citizenId}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-500 dark:text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-muted-foreground" />
                          <span className="line-clamp-1">
                            {customer.address}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-center font-semibold text-black dark:text-foreground">
                        {customer.totalLoans}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={[
                            "inline-flex w-[120px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                            statusClassName,
                          ].join(" ")}
                        >
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Mail,
  Eye,
  Headphones,
  ShieldCheck,
  Users,
  Zap,
  BarChart3,
  Building2,
  ArrowRight,
} from "lucide-react";

import type { FeatureItemProps, MiniCardProps } from "@/type/login.type";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative h-screen overflow-y-auto overflow-x-hidden bg-[#031b12] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(0,180,90,0.35),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(255,199,0,0.18),transparent_30%)]" />

      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT HERO */}
        <section className="relative flex flex-col justify-between px-5 py-5 sm:px-7 lg:px-10 lg:py-6">
          <div>
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3 lg:mb-10">
              <div className="flex h-11 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b8f4f] to-[#0fd36f] text-3xl font-black text-white shadow-[0_0_40px_rgba(0,255,140,0.35)]">
                F88
              </div>

              <div>
                <p className="text-xs font-medium text-white/75">
                  Tài chính bình dân
                </p>
              </div>
            </div>

            {/* Main text */}
            <div className="max-w-xl">
              <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
                Chào mừng
                <br />
                <span className="text-[#ffc400]">bạn quay lại</span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/75 lg:text-base lg:leading-7">
                Hệ thống quản lý khách hàng và khoản vay dành cho nhân viên F88,
                hỗ trợ xử lý hồ sơ nhanh chóng, bảo mật và minh bạch.
              </p>

              <div className="mt-5 h-1 w-16 rounded-full bg-[#ffc400]" />
            </div>

            {/* Feature list */}
            <div className="mt-7 grid max-w-xl gap-4 lg:mt-8">
              <FeatureItem
                icon={<ShieldCheck className="h-5 w-5" />}
                title="An toàn & Bảo mật"
                description="Dữ liệu khách hàng được mã hóa và kiểm soát truy cập."
              />

              <FeatureItem
                icon={<Zap className="h-5 w-5" />}
                title="Xử lý nhanh chóng"
                description="Tối ưu thao tác nhập liệu, kiểm tra và phê duyệt hồ sơ."
              />

              <FeatureItem
                icon={<Users className="h-5 w-5" />}
                title="Quản lý tập trung"
                description="Theo dõi khách hàng, tài sản và khoản vay trên một hệ thống."
              />
            </div>
          </div>

          {/* Bottom mini cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:mt-10">
            <MiniCard
              icon={<Zap className="h-4 w-4" />}
              title="Vay nhanh"
              description="Khởi tạo hồ sơ"
            />

            <MiniCard
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Bảo mật"
              description="Chuẩn hóa dữ liệu"
            />

            <MiniCard
              icon={<BarChart3 className="h-4 w-4" />}
              title="Theo dõi"
              description="Trạng thái xử lý"
            />

            <MiniCard
              icon={<Building2 className="h-4 w-4" />}
              title="PGD"
              description="Vận hành tập trung"
            />
          </div>
        </section>

        {/* RIGHT LOGIN FORM */}
        <section className="flex items-center justify-center px-5 py-5 sm:px-7 lg:px-10 lg:py-6">
          <Card className="w-full max-w-[460px] border-emerald-300/25 bg-[#05291c]/75 text-white shadow-[0_0_80px_rgba(0,255,140,0.18)] backdrop-blur-2xl">
            <CardHeader className="space-y-3 px-6 pb-4 pt-6 text-center">
              {/* Login logo */}
              <div className="mx-auto flex items-center justify-center gap-2">
                <div className="flex h-11 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b8f4f] to-[#0fd36f] text-3xl font-black text-white shadow-[0_0_40px_rgba(0,255,140,0.35)]">
                  F88
                </div>
              </div>

              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Công ty Cổ phần Kinh doanh F88
                </CardTitle>

                <CardDescription className="mt-1 text-sm text-white/60">
                  Đăng nhập vào hệ thống
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm text-white/80">
                  Số điện thoại / Email
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />

                  <Input
                    id="username"
                    placeholder="Nhập số điện thoại hoặc email"
                    className="h-11 border-emerald-300/35 bg-black/20 pl-10 text-sm text-white placeholder:text-white/35 focus-visible:ring-[#0fd36f]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-white/80">
                  Mật khẩu
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />

                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="h-11 border-emerald-300/35 bg-black/20 pl-10 pr-10 text-sm text-white placeholder:text-white/35 focus-visible:ring-[#0fd36f]"
                  />

                  <Eye className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="border-emerald-300 data-[state=checked]:bg-[#0fd36f] data-[state=checked]:text-[#05291c]"
                  />

                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-xs text-white/75 sm:text-sm"
                  >
                    Ghi nhớ đăng nhập
                  </Label>
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold text-[#0fd36f] hover:text-[#ffc400] sm:text-sm"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Login button */}
              <Button className="h-11 w-full bg-[#ffc400] text-sm font-bold text-[#082d1d] shadow-[0_0_28px_rgba(255,196,0,0.35)] hover:bg-[#ffd84a]">
                Đăng nhập
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-xs text-white/45">hoặc</span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              {/* Support button */}
              <Button
                variant="outline"
                className="h-11 w-full border-emerald-300/50 bg-transparent text-sm font-semibold text-[#0fd36f] hover:bg-emerald-400/10 hover:text-[#ffc400]"
              >
                <Headphones className="mr-2 h-4 w-4" />
                Liên hệ hỗ trợ
              </Button>

              {/* Footer trust text */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] text-white/45">
                <div>Bảo mật SSL/TLS</div>
                <div>PCI DSS</div>
                <div>Mã hóa dữ liệu</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-[#0fd36f] shadow-[0_0_25px_rgba(0,255,140,0.12)]">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-bold text-white lg:text-base">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-white/60 lg:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniCard({ icon, title, description }: MiniCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-white/[0.08] p-3 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#ffc400]/50 hover:bg-white/[0.12]">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffc400]/15 text-[#ffc400]">
        {icon}
      </div>

      <h4 className="text-sm font-bold text-white">{title}</h4>

      <p className="mt-0.5 text-[11px] text-white/55">{description}</p>
    </div>
  );
}

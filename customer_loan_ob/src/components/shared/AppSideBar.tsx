import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Add } from "iconsax-react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Building2,
  Car,
  ChevronDown,
  FileText,
  LayoutGrid,
  Settings,
  UserRound,
} from "lucide-react";

import { clearAllCccdCachedImages } from "@/features/customer-identify/storage/cccd-image-cache";
import { useLoanOnboardingStore } from "@/features/loan-onboarding/storage/loan-onboarding.storage";
import { Button } from "../ui/button";

const menuItems = [
  {
    title: "Trang chủ",
    url: "/",
    icon: LayoutGrid,
  },
  {
    title: "Khách hàng",
    url: "/customer",
    icon: UserRound,
  },
  {
    title: "Tài sản",
    url: "/asset",
    icon: Car,
  },
];

export default function AppSideBar() {
  const location = useLocation();
  const resetLoanOnboarding = useLoanOnboardingStore(
    (state) => state.resetLoanOnboarding,
  );
  const loanApplicationsActive = location.pathname.startsWith(
    "/loan/applications",
  );
  const loanDraftsActive = location.pathname.startsWith("/loan/drafts");
  const loanManagementActive = loanApplicationsActive || loanDraftsActive;
  const [loanMenuOpen, setLoanMenuOpen] = useState(loanManagementActive);

  useEffect(() => {
    setLoanMenuOpen(loanManagementActive);
  }, [loanManagementActive, location.pathname]);

  const menuButtonClass = [
    "h-11 rounded-xl px-3 text-white/55 transition-all",
    "hover:bg-[#007a1a] hover:text-white",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-0",
    "data-[active=true]:bg-[#006f18] data-[active=true]:text-white",
  ].join(" ");

  const subButtonClass = [
    "h-8 rounded-lg text-white/65 transition-colors",
    "hover:bg-[#007a1a] hover:text-white",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-0",
    "data-[active=true]:!bg-[#006f18] data-[active=true]:!text-white",
  ].join(" ");

  return (
    <Sidebar
      collapsible="icon"
      className="border-none bg-[#008B1D] text-white"
    >
      <SidebarTrigger
        title="Thu gọn hoặc mở rộng sidebar"
        aria-label="Thu gọn hoặc mở rộng sidebar"
        className="absolute -right-3 top-6 z-30 h-7 w-7 rounded-full border border-white/20 bg-[#008B1D] text-white shadow-md transition-all duration-200 hover:bg-[#16b116] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
      />

      <SidebarHeader className="bg-[#008B1D] px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#12b04b]">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-none text-white">
              F88 LOS
            </span>
            <span className="mt-1 whitespace-nowrap text-[11px] text-white/50">
              Loan Origination System
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#008B1D] px-3">
        <div className="flex h-11 items-center gap-2 rounded-lg bg-[#16b116] hover:bg-[#178117] group-data-[collapsible=icon]:justify-center">
          <Add
            size={30}
            color="currentColor"
            variant="Outline"
            className="shrink-0 pl-2 group-data-[collapsible=icon]:pl-0"
          />
          <Link
            to="/loan/customer-identify"
            className="group-data-[collapsible=icon]:hidden"
            onClick={() => {
              resetLoanOnboarding();
              clearAllCccdCachedImages();
            }}
          >
            <Button>Tạo hồ sơ mới</Button>
          </Link>
        </div>

        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Quản lý hồ sơ"
              aria-expanded={loanMenuOpen}
              onClick={() => setLoanMenuOpen((open) => !open)}
              className={[
                menuButtonClass,
                loanManagementActive ? "bg-[#006f18] text-white" : "",
              ].join(" ")}
            >
              <FileText className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Quản lý hồ sơ</span>
              <ChevronDown
                className={[
                  "ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                  loanMenuOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </SidebarMenuButton>

            <div
              className={[
                "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out group-data-[collapsible=icon]:hidden",
                loanMenuOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="min-h-0 overflow-hidden">
                <SidebarMenuSub className="border-white/20">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={loanApplicationsActive}
                      className={[
                        subButtonClass,
                        loanApplicationsActive ? "!bg-[#006f18] !text-white" : "",
                      ].join(" ")}
                    >
                      <Link to="/loan/applications">
                        <span>Hồ sơ vay</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={loanDraftsActive}
                      className={[
                        subButtonClass,
                        loanDraftsActive ? "!bg-[#006f18] !text-white" : "",
                      ].join(" ")}
                    >
                      <Link to="/loan/drafts">
                        <span>Hồ sơ vay nháp</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                </SidebarMenuSub>
              </div>
            </div>
          </SidebarMenuItem>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={[
                    menuButtonClass,
                    isActive ? "bg-[#006f18] text-white" : "",
                  ].join(" ")}
                >
                  <Link to={item.url}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-[#008B1D] px-3 pb-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Cài đặt"
              className={[
                menuButtonClass,
                location.pathname === "/setting" ? "bg-[#006f18] text-white" : "",
              ].join(" ")}
            >
              <Link to="/setting">
                <Settings className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Cài đặt</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Link, useLocation } from "@tanstack/react-router";

import {
  Building2,
  Car,
  FileText,
  LayoutGrid,
  Settings,
  UserRound,
} from "lucide-react";

const menuItems = [
  {
    title: "Trang chủ",
    url: "/",
    icon: LayoutGrid,
  },
  {
    title: "Hồ sơ vay",
    url: "/loan",
    icon: FileText,
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

  return (
    <Sidebar collapsible="icon" className="border-none bg-[#008B1D] text-white">
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
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={[
                    "h-11 rounded-xl px-3 text-white/55 transition-all",
                    "hover:bg-white/10 hover:text-white",
                    "data-[active=true]:bg-white/15 data-[active=true]:text-white",
                    isActive ? "bg-white/15 text-white" : "",
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
                "h-11 rounded-xl px-3 text-white/55 transition-all",
                "hover:bg-white/10 hover:text-white",
                location.pathname === "/setting"
                  ? "bg-white/15 text-white"
                  : "",
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

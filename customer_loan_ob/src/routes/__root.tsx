import AppHeader from "@/components/shared/AppHeader";
import AppSideBar from "@/components/shared/AppSideBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import {
  createRootRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  return (
    <>
      {isPublicRoute ? (
        <Outlet />
      ) : (
        <SidebarProvider className="[--sidebar-width:240px] [--sidebar-width-icon:64px]">
          <div className="flex min-h-screen w-full bg-background text-foreground">
            <AppSideBar />

            <SidebarInset className="min-w-0 flex-1 bg-background text-foreground transition-colors duration-300">
              <AppHeader />

              <main className="min-w-0 bg-background text-foreground transition-colors duration-300">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      )}

      <TanStackRouterDevtools position="bottom-right" initialIsOpen={false} />
      <Toaster />
    </>
  );
}

import { Bell, ChevronDown, MapPin } from "lucide-react";

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
      {/* Thông tin chi nhánh bên trái */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#009b3a]" />

        <span className="text-sm font-bold text-black">Chi nhánh:</span>

        <span className="text-sm text-gray-600">PGD Hoàng Mai - Hà Nội</span>
      </div>

      {/* Khu vực bên phải header */}
      <div className="flex items-center gap-5">
        {/* Nút thông báo */}
        <button
          type="button"
          className="relative rounded-full p-1.5 hover:bg-gray-100"
        >
          <Bell className="h-4 w-4 text-black" />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-400" />
        </button>

        <div className="h-7 w-px bg-gray-200" />

        {/* Thông tin người dùng */}
        <button type="button" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dff3e5] text-xs font-bold text-[#009b3a]">
            NT
          </div>

          <span className="text-sm font-bold text-black">Nguyễn Thị Lan</span>

          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </header>
  );
}

export default AppHeader;

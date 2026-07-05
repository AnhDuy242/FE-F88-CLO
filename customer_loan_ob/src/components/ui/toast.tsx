import { CheckCircle2, Info, XCircle } from "lucide-react";
import { create } from "zustand";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type ToastStore = {
  items: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
};

const recentMessages = new Map<string, number>();

export const useToastStore = create<ToastStore>((set, get) => ({
  items: [],
  push: (toast) => {
    const key = `${toast.variant}:${toast.message}`;
    const now = Date.now();
    const lastShownAt = recentMessages.get(key) || 0;

    if (now - lastShownAt < 2500) return;

    recentMessages.set(key, now);

    const id = `${key}:${now}`;

    set((state) => ({
      items: [...state.items.slice(-2), { ...toast, id }],
    }));

    window.setTimeout(() => {
      get().remove(id);
    }, 4200);
  },
  remove: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push({ variant: "success", message }),
  error: (message: string) => useToastStore.getState().push({ variant: "error", message }),
  info: (message: string) => useToastStore.getState().push({ variant: "info", message }),
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <CheckCircle2 className="h-5 w-5 text-[#009b3a]" />;
  if (variant === "error") return <XCircle className="h-5 w-5 text-red-500" />;

  return <Info className="h-5 w-5 text-[#8a6d00]" />;
}

export function Toaster() {
  const items = useToastStore((state) => state.items);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-5 top-5 z-[10000] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-[#dbe5dd] bg-white px-4 py-3 text-sm font-medium text-[#111827] shadow-lg transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2"
        >
          <ToastIcon variant={item.variant} />
          <p className="leading-5">{item.message}</p>
        </div>
      ))}
    </div>
  );
}

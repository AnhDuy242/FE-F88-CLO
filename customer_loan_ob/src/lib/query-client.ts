import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
})


// retry: 1
// → API lỗi thì thử lại 1 lần

// refetchOnWindowFocus: false
// → chuyển tab quay lại không tự gọi API lại liên tục

// staleTime: 1 phút
// → dữ liệu trong 1 phút được coi là còn mới
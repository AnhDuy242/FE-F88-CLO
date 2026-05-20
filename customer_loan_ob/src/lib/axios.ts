import axios from "axios"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})


// baseURL
// → địa chỉ API backend dùng chung

// timeout
// → nếu API quá 15 giây không phản hồi thì dừng request

// headers
// → mặc định gửi dữ liệu dạng JSON
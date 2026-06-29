import axios from "axios";
import { ENV } from "@/configs/env";

export const axiosClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000,
});

axiosClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      "Có lỗi xảy ra khi gọi API";

    return Promise.reject({
      status: error.response?.status,
      message,
      raw: error.response?.data,
    });
  }
);
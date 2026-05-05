import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "http://10.183.94.14:8000";

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

axiosPrivate.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");

      if (refreshToken) {
        const res = await axiosPublic.post("/api/login/refresh/", {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        Cookies.set("accessToken", newAccess, { expires: 7 });

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosPrivate(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

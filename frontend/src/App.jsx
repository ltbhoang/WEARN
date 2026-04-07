import React, { useState, useEffect } from "react"; // Thêm useEffect
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Header from "./layouts/Header";
import Sidebar from "./layouts/Sidebar";
import Footer from "./layouts/Footer";
import AppRoutes from "./routers/index";
import { axiosPrivate } from "./apis/axios";
import { useAuthStore } from "./store/authStore";
import "./App.css";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Lấy hàm refresh và token từ Store
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);
  const accessToken = useAuthStore((state) => state.accessToken);

  // --- BỘ CẢM BIẾN AXIOS (INTERCEPTORS) ---
  useEffect(() => {
    // 1. Trước khi gửi request: Tự gắn Access Token mới nhất vào Header
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Khi nhận phản hồi: Nếu lỗi 401 thì tự đi refresh token
    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response, // Nếu OK thì cho qua
      async (error) => {
        const prevRequest = error?.config;

        // Nếu lỗi 401 (Hết hạn) và chưa từng thử gửi lại request này
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true; // Đánh dấu để tránh lặp vô tận

          const newAccessToken = await refreshAccessToken(); // Gọi hàm refresh trong Store

          if (newAccessToken) {
            // Gắn token mới vào request cũ và chạy lại lần nữa
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(prevRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    // Dọn dẹp khi Component bị hủy (tránh rò rỉ bộ nhớ)
    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken, refreshAccessToken]);

  // --- LOGIC HIỂN THỊ UI ---
  const showHeader = location.pathname === "/";
  const noFooterRoutes = ["/", "/login", "/signup", "/flashcard/create"];

  const isFlashcardDetail = /^\/flashcard\/[^/]+$/.test(location.pathname);

  const showFooter =
    !noFooterRoutes.includes(location.pathname) && !isFlashcardDetail;

  return (
    <div className="h-screen flex flex-col">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {showHeader && (
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {showHeader && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-y-auto">
          <AppRoutes />
        </main>
      </div>

      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

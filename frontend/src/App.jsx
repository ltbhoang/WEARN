import React, { useState, useEffect } from "react"; // Thêm useEffect
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import AppRoutes from "./routers/index";
import { axiosPrivate } from "./apis/axios";
import { useAuthStore } from "./store/authStore";
import "./App.css";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response, 
      async (error) => {
        const prevRequest = error?.config;

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
  const noFooterRoutes = ["/", "/login", "/signup", "/flashcard/create", "/admin", "/admin/vocabularies", "/admin/lessons", "/admin/kanas", "/admin/users"];

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
        {showHeader}
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

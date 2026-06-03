import React, { useState } from "react";
import { Mail, Lock, Chrome, Apple } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const navigate = useNavigate();
  
  const { login, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const result = await login(username, password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrorMessage("Tên đăng nhập hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#E85A4F]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D8C3A5]/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div 
            onClick={() => navigate("/")} 
            className="inline-flex items-center justify-center w-16 h-16 bg-[#E85A4F] rounded-[1.8rem] shadow-lg mb-4 shadow-[#E85A4F]/20 cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="text-white font-black italic text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-black text-[#474747] tracking-tighter uppercase italic">
            Chào mừng <span className="text-[#E85A4F]">trở lại</span>
          </h1>
          <p className="text-[#8E8D8A] font-medium mt-2">Đăng nhập để tiếp tục hành trình!</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] border border-white">
          
          {/* HIỂN THỊ THÔNG BÁO LỖI NẾU ĐĂNG NHẬP THẤT BẠI */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-xl animate-pulse">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username"
                  className="w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:bg-white transition-all text-[#474747] font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:bg-white transition-all text-[#474747] font-medium"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold text-[#E85A4F] hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? 'bg-[#8E8D8A]' : 'bg-[#474747]'} text-white py-5 rounded-2xl font-black shadow-xl hover:bg-[#E85A4F] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group`}
            >
              {loading ? (
                "ĐANG XỬ LÝ..."
              ) : (
                <>
                  ĐĂNG NHẬP
                  <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-sm group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="flex-1 border-t border-gray-100"></div>
              <span className="mx-4 text-[10px] font-bold text-[#D8C3A5] uppercase tracking-widest">Hoặc</span>
              <div className="flex-1 border-t border-gray-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center py-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                <Chrome className="w-5 h-5 text-[#474747]" />
              </button>
              <button className="flex items-center justify-center py-4 bg-[#474747] rounded-2xl hover:opacity-90 transition-all shadow-sm">
                <Apple className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-sm font-medium text-[#8E8D8A]">
          Chưa có tài khoản?{" "}
          <button 
            onClick={() => navigate("/signup")} 
            className="text-[#E85A4F] font-black hover:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}
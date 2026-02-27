import React, { useState } from "react";
import { User, Mail, Lock, Chrome, Apple } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "confirmPassword" || name === "password") setPasswordError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }
    console.log("Signup with:", formData);
    navigate("/login"); // Đăng ký xong chuyển qua trang Login
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#E85A4F]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D8C3A5]/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div 
            onClick={() => navigate("/")} 
            className="inline-flex items-center justify-center w-16 h-16 bg-[#E85A4F] rounded-[1.8rem] shadow-lg mb-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="text-white font-black italic text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-black text-[#474747] tracking-tighter uppercase italic">
            Tạo tài khoản <span className="text-[#E85A4F]">mới</span>
          </h1>
          <p className="text-[#8E8D8A] font-medium mt-2">Bắt đầu hành trình học tập cùng Wearn</p>
        </div>

        <div className="backdrop-blur-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field Name */}
            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">Họ và tên</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors"><User className="w-5 h-5" /></div>
                <input
                  type="text"
                  name="fullName"
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:bg-white transition-all text-[#474747]"
                  required
                />
              </div>
            </div>

            {/* Field Email */}
            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors"><Mail className="w-5 h-5" /></div>
                <input
                  type="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:bg-white transition-all text-[#474747]"
                  required
                />
              </div>
            </div>

            {/* Field Password */}
            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors"><Lock className="w-5 h-5" /></div>
                <input
                  type="password"
                  name="password"
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:bg-white transition-all text-[#474747]"
                  required
                />
              </div>
            </div>

            {/* Field Confirm Password */}
            <div>
              <label className="block text-[10px] font-black text-[#8E8D8A] uppercase tracking-[0.2em] mb-2 ml-1">Xác nhận mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D8C3A5] group-focus-within:text-[#E85A4F] transition-colors"><Lock className="w-5 h-5" /></div>
                <input
                  type="password"
                  name="confirmPassword"
                  onChange={handleChange}
                  className={`w-full pl-12 pr-6 py-4 bg-[#FAF9F8] border rounded-2xl focus:outline-none focus:ring-2 transition-all ${passwordError ? 'border-red-400 ring-red-100' : 'border-gray-100 focus:ring-[#E85A4F]/20'}`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordError && <p className="text-red-400 text-[10px] font-bold mt-2 ml-1 italic">{passwordError}</p>}
            </div>

            <button type="submit" className="w-full bg-[#474747] text-white py-5 rounded-2xl font-black shadow-xl hover:bg-[#E85A4F] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 group">
              ĐĂNG KÝ <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </form>
        </div>


        <p className="text-center mt-8 text-sm font-medium text-[#8E8D8A]">
          Đã có tài khoản?{" "}
          <button 
            onClick={() => navigate("/login")} 
            className="text-[#E85A4F] font-black hover:underline"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}
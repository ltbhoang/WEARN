import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Camera,
  Edit2,
  Save,
  X,
  Flame,
  TrendingUp,
  Award,
  Lock,
} from "lucide-react";

// Import avatar images (giả sử các file ảnh nằm trong thư mục assets/islands)
import avatar107 from "../../assets/islands/107.c3e123902d831a9.jpg";
import avatar108 from "../../assets/islands/108.3b3090077134db3.jpg";
import avatar109 from "../../assets/islands/109.5b75ca8158c771c.jpg";
import avatar110 from "../../assets/islands/110.36d90f6882d4593.jpg";
import avatar111 from "../../assets/islands/111.f9dd73353feb908.jpg";
import avatar112 from "../../assets/islands/112.c90135dfc341a90.jpg";
import avatar114 from "../../assets/islands/114.0adc064c9a6d1eb.jpg";
import avatar115 from "../../assets/islands/115.70946d9217589e8.jpg";
import avatar116 from "../../assets/islands/116.9aaedd4f4495837.jpg";
import avatar117 from "../../assets/islands/117.3cd40b021ac604f.jpg";
import avatar118 from "../../assets/islands/118.17bed2945aa1600.jpg";
import avatar119 from "../../assets/islands/119.ed0b39ac3915639.jpg";
import avatar120 from "../../assets/islands/120.bd14e2049ea1628.jpg";
import avatar121 from "../../assets/islands/121.86d7c15a5a6be0f.jpg";
import avatar122 from "../../assets/islands/122.c263b6b48ca2b1a.jpg";

const avatarOptions = [
  avatar107, avatar108, avatar109, avatar110,
  avatar111, avatar112, avatar114, avatar115,
  avatar116, avatar117, avatar118, avatar119,
  avatar120, avatar121, avatar122,
];

// Mock user data
const mockUser = {
  fullName: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  bio: "Tôi yêu tiếng Nhật và đang chinh phục JLPT N2.",
  avatarUrl: avatar107,
};

// Mock stats
const mockStats = {
  streakDays: 7,
  totalScans: 42,
  totalFlashcards: 128,
  totalKanjiLearned: 128, // fallback
};

const Profile = () => {
  const navigate = useNavigate();

  // State
  const [editMode, setEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const fileInputRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: mockUser.fullName,
    bio: mockUser.bio,
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Avatar preview (giả sử sau khi chọn, cập nhật avatarUrl)
  const [avatarUrl, setAvatarUrl] = useState(mockUser.avatarUrl);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    // Giả lập đổi mật khẩu thành công
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordModal(false);
  };

  const handleAvatarSelect = (avatar) => {
    setAvatarUrl(avatar);
    setShowAvatarModal(false);
    setShowFileUpload(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Giả lập upload: tạo URL tạm thời từ file
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    setShowAvatarModal(false);
    setShowFileUpload(false);
  };
  
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      {/* Header giống StreakPage */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Hồ sơ cá nhân</h1>
        </div>

        {/* Avatar và tên */}
        <div className="bg-white rounded-3xl p-6 shadow-lg flex items-center gap-6">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-rose-200 shadow-lg cursor-pointer"
              onClick={() => setShowAvatarModal(true)}
            />
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 bg-[#E85A4F] text-white p-1.5 rounded-full shadow-lg hover:bg-[#D94F3E] transition"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">{mockUser.fullName}</h2>
            <p className="text-sm text-[#8E8D8A]">{mockUser.email}</p>
          </div>
        </div>
      </div>

      {/* Stats cards - giống StreakPage */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl p-5 grid grid-cols-3 gap-4 shadow-md">
          <div className="text-center">
            <Flame className="w-6 h-6 text-[#E85A4F] mx-auto mb-1" />
            <p className="text-xs text-[#8E8D8A]">Streak</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{mockStats.streakDays} ngày</p>
          </div>
          <div className="text-center">
            <Camera className="w-6 h-6 text-[#E85A4F] mx-auto mb-1" />
            <p className="text-xs text-[#8E8D8A]">Số lần scan</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{mockStats.totalScans}</p>
          </div>
          <div className="text-center">
            <Award className="w-6 h-6 text-[#E85A4F] mx-auto mb-1" />
            <p className="text-xs text-[#8E8D8A]">Flashcard</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{mockStats.totalFlashcards}</p>
          </div>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2D2D2D]">Thông tin cá nhân</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-[#E85A4F] hover:text-[#D94F3E] transition"
            >
              {editMode ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-4">
            {/* Tên */}
            <div>
              <label className="text-sm font-medium text-[#8E8D8A] block mb-1">Tên</label>
              {editMode ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]"
                />
              ) : (
                <p className="text-[#2D2D2D] font-medium">{mockUser.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-[#8E8D8A] block mb-1">Email</label>
              <p className="text-[#2D2D2D] font-medium">{mockUser.email}</p>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-[#8E8D8A] block mb-1">Giới thiệu</label>
              {editMode ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]"
                />
              ) : (
                <p className="text-[#2D2D2D]">{mockUser.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Mật khẩu</h2>
            <p className="text-sm text-[#8E8D8A] mt-1">Thay đổi mật khẩu của bạn</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-[#E85A4F] text-white rounded-xl font-semibold hover:bg-[#D94F3E] transition"
          >
            Đổi
          </button>
        </div>
      </div>

      {/* Nút hành động chính */}
      <div className="px-6 mt-6">
        <button className="w-full py-4 bg-gradient-to-r from-slate-500 to-[#E85A4F] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tiếp tục học để cải thiện thành tích
        </button>
      </div>

      {/* Modal chọn avatar */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2D2D2D]">Chọn ảnh đại diện</h2>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!showFileUpload ? (
              <>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                  {avatarOptions.map((avatar, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAvatarSelect(avatar)}
                      className="hover:scale-110 transition"
                    >
                      <img
                        src={avatar}
                        alt={`avatar-${idx}`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 hover:border-[#E85A4F]"
                      />
                    </button>
                  ))}
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-2xl hover:border-[#E85A4F] hover:bg-rose-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-center text-gray-500">Nhấn vào ảnh để chọn, hoặc dấu + để tải lên</p>
              </>
            ) : (
              <div className="text-center py-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3 bg-[#E85A4F] text-white rounded-xl hover:bg-[#D94F3E] transition"
                >
                  Chọn ảnh từ máy tính
                </button>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="ml-3 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal đổi mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2D2D2D]">Đổi mật khẩu</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8E8D8A] mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]"
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8E8D8A] mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]"
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8E8D8A] mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]"
                  placeholder="••••••"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-3 bg-[#E85A4F] text-white rounded-xl font-semibold hover:bg-[#D94F3E]"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
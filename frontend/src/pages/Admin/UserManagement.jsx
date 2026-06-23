import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Loader,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAdminUserStore } from "../../store/adminStore";

const UserManagement = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    deleteUser,
    toggleActive,
    clearError,
  } = useAdminUserStore();

  const userList = Array.isArray(users) ? users : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const pageSize = 20;

  // Modal chỉnh sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    first_name: "",
    is_staff: false,
    is_active: true,
  });

  // Confirm dialog chung
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: null,
    variant: "danger",
  });

  // Lọc
  const filteredUsers = useMemo(() => {
    if (activeTab === "all") return userList;
    if (activeTab === "staff") return userList.filter((u) => u.is_staff);
    if (activeTab === "user") return userList.filter((u) => !u.is_staff);
    return userList;
  }, [userList, activeTab]);

  const searchedUsers = useMemo(() => {
    if (!searchTerm.trim()) return filteredUsers;
    const term = searchTerm.toLowerCase().trim();
    return filteredUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term)
    );
  }, [filteredUsers, searchTerm]);

  // Load dữ liệu
  useEffect(() => {
    fetchUsers({ page: currentPage, page_size: pageSize, search: searchTerm });
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Mở modal edit
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      is_staff: user.is_staff || false,
      is_active: user.is_active !== undefined ? user.is_active : true,
    });
    setShowEditModal(true);
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = async () => {
    try {
      await updateUser(editingUser.id, editForm);
      setShowEditModal(false);
      fetchUsers({ page: currentPage, page_size: pageSize, search: searchTerm });
      alert("✅ Cập nhật thông tin thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  // Xử lý toggle active (mở confirm)
  const handleToggleActive = (user) => {
    const isDeactivating = user.is_active;
    setConfirmDialog({
      open: true,
      title: isDeactivating ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản",
      message: isDeactivating
        ? `Bạn có chắc muốn vô hiệu hóa tài khoản của "${user.username}"? Người dùng sẽ không thể đăng nhập.`
        : `Bạn có chắc muốn kích hoạt lại tài khoản của "${user.username}"? Người dùng sẽ có thể đăng nhập.`,
      confirmText: isDeactivating ? "Vô hiệu hóa" : "Kích hoạt",
      variant: isDeactivating ? "danger" : "warning",
      onConfirm: async () => {
        try {
          await toggleActive(user.id);
          fetchUsers({ page: currentPage, page_size: pageSize, search: searchTerm });
          alert(`✅ ${isDeactivating ? "Vô hiệu hóa" : "Kích hoạt"} thành công!`);
        } catch (err) {
          alert(err.response?.data?.message || "Thao tác thất bại");
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  // Xử lý xóa (mở confirm)
  const handleDelete = (user) => {
    setConfirmDialog({
      open: true,
      title: "Xóa người dùng",
      message: `Bạn có chắc muốn xóa vĩnh viễn tài khoản "${user.username}"? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          fetchUsers({ page: currentPage, page_size: pageSize, search: searchTerm });
          alert("✅ Xóa người dùng thành công!");
        } catch (err) {
          alert(err.response?.data?.message || "Xóa thất bại");
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  // Phân trang
  const getCurrentPageData = () => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return searchedUsers.slice(start, end);
  };

  const totalPages = Math.ceil(searchedUsers.length / pageSize);

  return (
    <div className="bg-white rounded-4xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm">
            Tổng số: {searchedUsers.length} người dùng
            {activeTab !== "all" && (
              <span className="ml-2 text-xs text-gray-400">
                ({activeTab === "staff" ? "Admin" : "User thường"})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: "all", label: "Tất cả" },
          { key: "staff", label: "Admin" },
          { key: "user", label: "Người dùng thường" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#E85A4F] text-[#E85A4F]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Tìm kiếm theo username, email, tên..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
          {error}
          <button onClick={clearError} className="ml-2 text-red-500 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Bảng */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    <Loader className="w-5 h-5 animate-spin text-[#E85A4F] inline-block mr-2" /> Đang tải...
                  </td>
                </tr>
              )}
              {!loading && searchedUsers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    {searchTerm
                      ? "Không tìm thấy người dùng phù hợp"
                      : "Chưa có người dùng nào trong nhóm này"}
                  </td>
                </tr>
              )}
              {!loading &&
                getCurrentPageData().map((user, index) => {
                  const stt = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-center text-sm text-gray-500">
                        {stt}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.email || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.first_name || "-"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {user.is_staff ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            <Shield className="w-3.5 h-3.5" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <ShieldOff className="w-3.5 h-3.5" /> User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {user.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Vô hiệu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit size={17} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.is_active
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {user.is_active ? <UserX size={17} /> : <UserCheck size={17} />}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, searchedUsers.length)} / {searchedUsers.length} người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal chỉnh sửa */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Sửa thông tin người dùng</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_staff}
                    onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
                    className="w-4 h-4 text-[#E85A4F] rounded border-gray-300 focus:ring-[#E85A4F]"
                  />
                  <span className="text-sm font-medium text-gray-700">Admin (Staff)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#E85A4F] rounded border-gray-300 focus:ring-[#E85A4F]"
                  />
                  <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#E85A4F] text-white rounded-lg hover:bg-[#d94a3f] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={18} />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    confirmDialog.variant === "danger"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{confirmDialog.title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  confirmDialog.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
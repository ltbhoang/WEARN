import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Loader,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Filter,
} from "lucide-react";
import { useAdminKanjiStore } from "../../store/adminStore";
import { axiosPrivate } from "../../apis/axios";

// Map JLPT level
const jlptLevelMap = {
  N5: "N5 (Sơ cấp)",
  N4: "N4 (Trung cấp 1)",
  N3: "N3 (Trung cấp 2)",
  N2: "N2 (Cao cấp 1)",
  N1: "N1 (Cao cấp 2)",
};

const formatJlpt = (level) => {
  if (!level) return "-";
  return jlptLevelMap[level] || level;
};

const KanjiManagement = () => {
  const {
    kanjis,
    pagination,
    loading,
    error,
    fetchKanjis,
    createKanji,
    updateKanji,
    deleteKanji,
    clearError,
  } = useAdminKanjiStore();

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // State cho modal thêm/sửa
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Đã bỏ stroke_count và grade
  const [formData, setFormData] = useState({
    character: "",
    meaning: "",
    onyomi: "",
    kunyomi: "",
    jlpt_level: "N5",
  });

  // State cho import Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchKanjis({
        page: 1,
        page_size: pageSize,
        search: searchTerm,
        jlpt_level: selectedLevel || undefined,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedLevel]);

  // Load dữ liệu khi trang thay đổi
  useEffect(() => {
    fetchKanjis({
      page: currentPage,
      page_size: pageSize,
      search: searchTerm,
      jlpt_level: selectedLevel || undefined,
    });
  }, [currentPage]);

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Mở modal thêm mới
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      character: "",
      meaning: "",
      onyomi: "",
      kunyomi: "",
      jlpt_level: "N5",
    });
    setShowModal(true);
  };

  // Mở modal sửa
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      character: item.character || "",
      meaning: item.meaning || "",
      onyomi: item.onyomi || "",
      kunyomi: item.kunyomi || "",
      jlpt_level: item.jlpt_level || "N5",
    });
    setShowModal(true);
  };

  // Xóa Kanji
  const handleDelete = async (id) => {
    if (window.confirm(`Bạn có chắc muốn xóa Kanji "${id}"?`)) {
      await deleteKanji(id);
      await fetchKanjis({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm,
        jlpt_level: selectedLevel || undefined,
      });
    }
  };

  // Upload ảnh (giữ lại nhưng không dùng)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh (jpg, png, ...)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 5MB");
      return;
    }
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await axiosPrivate.post("/api/upload-temp-image/", {
        image_base64: base64,
      });
      alert("Tải ảnh lên thành công!");
    } catch (err) {
      console.error("Upload ảnh thất bại:", err);
      alert(
        err.response?.data?.error || "Không thể tải ảnh lên. Vui lòng thử lại."
      );
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Lưu form (thêm mới hoặc cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra trùng ký tự
    const isDuplicate = kanjis.some(
      (k) =>
        k.character === formData.character.trim() &&
        (editingItem ? k.id !== editingItem.id : true)
    );
    if (isDuplicate) {
      alert(`Kanji "${formData.character}" đã tồn tại trong hệ thống!`);
      return;
    }

    try {
      const payload = {
        ...formData,
        stroke_count: 0, // luôn set 0
        grade: null, // luôn set null
      };

      if (editingItem) {
        await updateKanji(editingItem.id, payload);
      } else {
        await createKanji(payload);
      }
      setShowModal(false);
      await fetchKanjis({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm,
        jlpt_level: selectedLevel || undefined,
      });
    } catch (err) {
      console.error("Lỗi khi lưu Kanji:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    clearError();
  };

  // --- Xử lý import Excel ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const requiredFields = ["character", "meaning"];
        const errors = [];
        const validData = jsonData.filter((row, index) => {
          const missing = requiredFields.filter(
            (f) => !row[f] || row[f].toString().trim() === ""
          );
          if (missing.length) {
            errors.push(`Dòng ${index + 2}: thiếu ${missing.join(", ")}`);
            return false;
          }
          return true;
        });

        if (errors.length) {
          setImportError(errors.join("; "));
          setImportData([]);
          return;
        }

        setImportData(validData);
      } catch (err) {
        setImportError("Không thể đọc file. Vui lòng kiểm tra định dạng.");
        setImportData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!importData.length) {
      alert("Không có dữ liệu hợp lệ để import.");
      return;
    }

    setImportLoading(true);
    try {
      const payload = importData.map((row) => ({
        character: row.character.trim(),
        meaning: row.meaning.trim(),
        onyomi: row.onyomi?.trim() || "",
        kunyomi: row.kunyomi?.trim() || "",
        stroke_count: parseInt(row.stroke_count) || 0,
        jlpt_level: row.jlpt_level?.trim() || "N5",
        grade: row.grade ? parseInt(row.grade) : null,
      }));

      const response = await axiosPrivate.post("/api/kanjis/bulk/", {
        kanjis: payload,
      });

      const { created, errors, total } = response.data;

      if (created === total && errors.length === 0) {
        alert(`✅ Import thành công ${created} Kanji!`);
        setShowImportModal(false);
        setImportFile(null);
        setImportData([]);
        fetchKanjis({
          page: currentPage,
          page_size: pageSize,
          search: searchTerm,
          jlpt_level: selectedLevel || undefined,
        });
        return;
      }

      if (created > 0 && errors.length > 0) {
        const errorDetails = errors
          .map(
            (e) =>
              `🔴 Dòng ${e.row}: "${e.character}" - ${Object.values(
                e.errors
              ).join(", ")}`
          )
          .join("\n");

        const confirmMsg =
          `⚠️ Import thành công ${created} Kanji.\n` +
          `Có ${errors.length} dòng bị lỗi (đã bỏ qua):\n\n${errorDetails}\n\n` +
          `Bạn có muốn đóng modal không?`;

        if (window.confirm(confirmMsg)) {
          setShowImportModal(false);
          setImportFile(null);
          setImportData([]);
          fetchKanjis({
            page: currentPage,
            page_size: pageSize,
            search: searchTerm,
            jlpt_level: selectedLevel || undefined,
          });
        }
        return;
      }

      if (created === 0 && errors.length > 0) {
        const errorDetails = errors
          .map(
            (e) =>
              `🔴 Dòng ${e.row}: "${e.character}" - ${Object.values(
                e.errors
              ).join(", ")}`
          )
          .join("\n");

        alert(
          `❌ Import thất bại. Tất cả ${total} dòng đều có lỗi:\n\n${errorDetails}`
        );
        return;
      }

      alert("Không có Kanji nào được import.");
    } catch (err) {
      console.error("Import lỗi:", err);
      console.error("Response data:", err.response?.data);
      alert(
        "Import thất bại. Lỗi: " +
          JSON.stringify(err.response?.data, null, 2) +
          "\n\nChi tiết: " +
          err.message
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Chuyển trang
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Loading state
  if (loading && kanjis.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-[#E85A4F]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-4xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Kanji</h1>
          <p className="text-gray-500 text-sm">
            Tổng số: {pagination.totalItems || kanjis.length} Kanji
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet size={20} />
            Import Excel
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#E85A4F] text-white px-4 py-2 rounded-lg hover:bg-[#d94a3f] transition-colors"
          >
            <Plus size={20} />
            Thêm Kanji mới
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm Kanji (character, meaning, onyomi, kunyomi)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F] bg-white min-w-[160px]"
        >
          <option value="">Tất cả cấp độ</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-500 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ký tự
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nghĩa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Onyomi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunyomi
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cấp độ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin text-[#E85A4F]" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && kanjis.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    {searchTerm || selectedLevel
                      ? "Không tìm thấy Kanji nào"
                      : "Chưa có Kanji nào"}
                  </td>
                </tr>
              )}
              {!loading &&
                kanjis.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm font-bold text-gray-900 text-xl">
                      {item.character || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.meaning || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.onyomi || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.kunyomi || "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          item.jlpt_level === "N5"
                            ? "bg-green-100 text-green-700"
                            : item.jlpt_level === "N4"
                            ? "bg-blue-100 text-blue-700"
                            : item.jlpt_level === "N3"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.jlpt_level === "N2"
                            ? "bg-orange-100 text-orange-700"
                            : item.jlpt_level === "N1"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {formatJlpt(item.jlpt_level)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Hiển thị {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
              -{" "}
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}{" "}
              / {pagination.totalItems} Kanji
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa Kanji - ĐÃ BỎ stroke_count & grade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? "Sửa Kanji" : "Thêm Kanji mới"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ký tự <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.character}
                    onChange={(e) =>
                      setFormData({ ...formData, character: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nghĩa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meaning}
                    onChange={(e) =>
                      setFormData({ ...formData, meaning: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onyomi
                  </label>
                  <input
                    type="text"
                    value={formData.onyomi}
                    onChange={(e) =>
                      setFormData({ ...formData, onyomi: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kunyomi
                  </label>
                  <input
                    type="text"
                    value={formData.kunyomi}
                    onChange={(e) =>
                      setFormData({ ...formData, kunyomi: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cấp độ JLPT <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jlpt_level}
                    onChange={(e) =>
                      setFormData({ ...formData, jlpt_level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
                {/* Đã bỏ stroke_count và grade */}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#E85A4F] text-white rounded-lg hover:bg-[#d94a3f] disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingItem ? "Cập nhật" : "Thêm mới"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel - giữ nguyên */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Import Kanji từ Excel
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportData([]);
                  setImportError("");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <p>
                  <strong>Yêu cầu file Excel:</strong>
                </p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>
                    Các cột bắt buộc: <strong>character</strong>,{" "}
                    <strong>meaning</strong>
                  </li>
                  <li>
                    Các cột tùy chọn: onyomi, kunyomi, stroke_count, jlpt_level,
                    grade
                  </li>
                  <li>Hàng đầu tiên là tiêu đề cột (không import)</li>
                  <li>Định dạng: .xlsx hoặc .xls</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload-kanji"
                />
                <label
                  htmlFor="excel-upload-kanji"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {importFile ? importFile.name : "Nhấn để chọn file Excel"}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Hỗ trợ .xlsx, .xls
                  </span>
                </label>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {importError}
                </div>
              )}

              {importData.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-sm text-gray-500 mb-2">
                    Dữ liệu ({importData.length} dòng)
                  </p>
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(importData[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td
                              key={i}
                              className="px-4 py-2 text-sm text-gray-700"
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {importData.length > 10 && (
                        <tr>
                          <td
                            colSpan={Object.keys(importData[0]).length}
                            className="px-4 py-2 text-sm text-gray-400 text-center"
                          >
                            ... và {importData.length - 10} dòng khác
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportData([]);
                    setImportError("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImport}
                  disabled={importData.length === 0 || importLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {importLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Import {importData.length} Kanji
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanjiManagement;

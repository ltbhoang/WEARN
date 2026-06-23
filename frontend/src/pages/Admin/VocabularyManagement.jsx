/* eslint-disable no-unused-vars */
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
} from "lucide-react";
import { useAdminVocabularyStore } from "../../store/adminStore";
import { axiosPrivate } from "../../apis/axios";

// Map topic sang tiếng Việt có dấu
const topicMap = {
  cothe: "Cơ thể",
  tinhtu: "Tính từ",
  tinhtu_i: "Tính từ -i",
  tinhtu_na: "Tính từ -na",
  dongtu: "Động từ",
  danhtu: "Danh từ",
  trangtu: "Trạng từ",
  tunghevan: "Từ để hỏi",
  daitu: "Đại từ",
  nghevan: "Từ nghi vấn",
  tu_noi: "Từ nối",
  thoigian: "Thời gian",
  mua: "Mùa",
  huong: "Hướng",
  vitri: "Vị trí",
  sodem: "Số đếm",
  doan: "Đồ ăn",
  doan_ung: "Đồ uống",
  rau: "Rau củ",
  thit: "Thịt",
  giavi: "Gia vị",
  luongthuc: "Lương thực",
  dongvat: "Động vật",
  thiennhien: "Thiên nhiên",
  thoitiet: "Thời tiết",
  nhacua: "Nhà cửa",
  kientruc: "Kiến trúc",
  dovan: "Đồ vật",
  dodung: "Đồ dùng",
  vesinh: "Vệ sinh",
  phukien: "Phụ kiện",
  quanao: "Quần áo",
  sothich: "Sở thích",
  giaitri: "Giải trí",
  suckhoe: "Sức khỏe",
  connguoi: "Con người",
  giadinh: "Gia đình",
  nghenghiep: "Nghề nghiệp",
  congty: "Công ty",
  truonghoc: "Trường học",
  "hoc tap": "Học tập",
  diadiem: "Địa điểm",
  thanhpho: "Thành phố",
  giaothong: "Giao thông",
  mausac: "Màu sắc",
  vatlieu: "Vật liệu",
  khac: "Khác",
  it: "Công nghệ thông tin",
  extra: "Bổ sung",
  imagenet: "ImageNet",
};

const formatTopic = (topic) => {
  if (!topic) return "-";
  return topicMap[topic] || topic.charAt(0).toUpperCase() + topic.slice(1);
};

const ImageThumbnail = ({ url, alt }) => {
  if (!url) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
        No img
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className="w-12 h-12 object-cover rounded-lg"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "";
        e.target.alt = "Lỗi ảnh";
        e.target.className =
          "w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs";
        e.target.parentNode.innerHTML =
          '<div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>';
      }}
    />
  );
};

const VocabularyManagement = () => {
  const {
    vocabularies,
    pagination,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchVocabularies,
    createVocabulary,
    updateVocabulary,
    deleteVocabulary,
    clearError,
  } = useAdminVocabularyStore();

  // State cho modal thêm/sửa
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wordError, setWordError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [formData, setFormData] = useState({
    word: "",
    meaning: "",
    pronunciation: "",
    topic: "",
    reading_hiragana: "",
    example_sentence: "",
    example_translation: "",
    image_url: "",
  });

  // State cho import Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Lấy danh sách topic từ backend
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axiosPrivate.get("/api/vocabularies/topics/");
        setTopics(response.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách topic:", err);
      }
    };
    fetchTopics();
  }, []);

  // Load dữ liệu khi trang, search, hoặc topic thay đổi
  useEffect(() => {
    fetchVocabularies({
      page: currentPage,
      page_size: pageSize,
      search: searchTerm,
      topic: selectedTopic || undefined,
    });
  }, [currentPage, pageSize, searchTerm, selectedTopic]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Mở modal thêm mới
  const handleAddNew = () => {
    setEditingItem(null);
    setWordError("");
    setFormData({
      word: "",
      meaning: "",
      pronunciation: "",
      topic: "",
      reading_hiragana: "",
      example_sentence: "",
      example_translation: "",
      image_url: "",
    });
    setShowModal(true);
  };

  // Mở modal sửa
  const handleEdit = (item) => {
    setEditingItem(item);
    setWordError("");
    setFormData({
      word: item.word || "",
      meaning: item.meaning || "",
      pronunciation: item.pronunciation || "",
      topic: item.topic || "",
      reading_hiragana: item.reading_hiragana || "",
      example_sentence: item.example_sentence || "",
      example_translation: item.example_translation || "",
      image_url: item.image_url || "",
    });
    setShowModal(true);
  };

  // Xóa từ vựng
  const handleDelete = async (class_name) => {
    if (window.confirm(`Bạn có chắc muốn xóa từ "${class_name}"?`)) {
      await deleteVocabulary(class_name);
      await fetchVocabularies({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm,
        topic: selectedTopic || undefined,
      });
    }
  };

  // Upload ảnh (1 ảnh)
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

      const imageUrl = response.data.image_url;
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
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

    const isDuplicate = vocabularies.some(
      (v) =>
        v.word.toLowerCase() === formData.word.trim().toLowerCase() &&
        (editingItem ? v.id !== editingItem.id : true)
    );
    if (isDuplicate) {
      alert(`Từ "${formData.word}" đã tồn tại trong hệ thống!`);
      return;
    }

    try {
      const payload = { ...formData };

      if (editingItem) {
        await updateVocabulary(editingItem.class_name, payload);
      } else {
        await createVocabulary(payload);
      }
      setShowModal(false);
      await fetchVocabularies({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm,
        topic: selectedTopic || undefined,
      });
    } catch (err) {
      console.error("Lỗi khi lưu từ vựng:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setWordError("");
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

        // Validate dữ liệu
        const requiredFields = ["word", "meaning"];
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
        word: row.word.trim(),
        meaning: row.meaning.trim(),
        pronunciation: row.pronunciation?.trim() || "",
        topic: row.topic?.trim() || "",
        reading_hiragana: row.reading_hiragana?.trim() || "",
        example_sentence: row.example_sentence?.trim() || "",
        example_translation: row.example_translation?.trim() || "",
        image_url: row.image_url?.trim() || "",
      }));

      const response = await axiosPrivate.post("/api/vocabularies/bulk/", {
        vocabularies: payload,
      });

      const { created, errors, total } = response.data;

      // Trường hợp 1: Import thành công tất cả
      if (created === total && errors.length === 0) {
        alert(`✅ Import thành công ${created} từ vựng!`);
        setShowImportModal(false);
        setImportFile(null);
        setImportData([]);
        fetchVocabularies({
          page: currentPage,
          page_size: pageSize,
          search: searchTerm,
          topic: selectedTopic || undefined,
        });
        return;
      }

      // Trường hợp 2: Một phần thành công, một phần lỗi
      if (created > 0 && errors.length > 0) {
        const errorDetails = errors
          .map(
            (e) =>
              `🔴 Dòng ${e.row}: "${e.word}" - ${Object.values(e.errors).join(
                ", "
              )}`
          )
          .join("\n");

        const confirmMsg =
          `⚠️ Import thành công ${created} từ vựng.\n` +
          `Có ${errors.length} dòng bị lỗi (đã bỏ qua):\n\n${errorDetails}\n\n` +
          `Bạn có muốn đóng modal không?`;

        if (window.confirm(confirmMsg)) {
          setShowImportModal(false);
          setImportFile(null);
          setImportData([]);
          fetchVocabularies({
            page: currentPage,
            page_size: pageSize,
            search: searchTerm,
            topic: selectedTopic || undefined,
          });
        }
        return;
      }

      // Trường hợp 3: Toàn bộ lỗi
      if (created === 0 && errors.length > 0) {
        const errorDetails = errors
          .map(
            (e) =>
              `🔴 Dòng ${e.row}: "${e.word}" - ${Object.values(e.errors).join(
                ", "
              )}`
          )
          .join("\n");

        alert(
          `❌ Import thất bại. Tất cả ${total} dòng đều có lỗi:\n\n${errorDetails}`
        );
        return;
      }

      // Trường hợp 4: Không có dữ liệu import
      alert("Không có từ vựng nào được import.");
    } catch (err) {
      console.error("Import lỗi:", err);
      alert(err.response?.data?.error || "Import thất bại. Vui lòng thử lại.");
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
  if (loading && vocabularies.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý từ vựng</h1>
          <p className="text-gray-500 text-sm">
            Tổng số: {pagination.totalItems || vocabularies.length} từ
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
            Thêm từ mới
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
          />
        </div>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F] bg-white min-w-[160px]"
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {formatTopic(topic)}
            </option>
          ))}
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
                  Hình ảnh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Từ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nghĩa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiragana
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ đề
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
              {!loading && vocabularies.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    {searchTerm || selectedTopic
                      ? "Không tìm thấy từ vựng nào"
                      : "Chưa có từ vựng nào"}
                  </td>
                </tr>
              )}
              {!loading &&
                vocabularies.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <ImageThumbnail url={item.image_url} alt={item.word} />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {item.word || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.meaning || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.reading_hiragana || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {formatTopic(item.topic)}
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
                          onClick={() => handleDelete(item.class_name)}
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
              / {pagination.totalItems} từ
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

      {/* Modal thêm/sửa từ vựng */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? "Sửa từ vựng" : "Thêm từ vựng mới"}
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
                    Từ vựng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
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
                    Phát âm (Romaji)
                  </label>
                  <input
                    type="text"
                    value={formData.pronunciation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pronunciation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chủ đề
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đọc Hiragana
                  </label>
                  <input
                    type="text"
                    value={formData.reading_hiragana}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reading_hiragana: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL ảnh
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                      placeholder="https://example.com/image.jpg"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div
                        className={`flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${
                          uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingImage ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span className="text-sm">Tải ảnh</span>
                      </div>
                    </label>
                  </div>
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Câu ví dụ
                </label>
                <input
                  type="text"
                  value={formData.example_sentence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      example_sentence: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dịch câu ví dụ
                </label>
                <input
                  type="text"
                  value={formData.example_translation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      example_translation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F]"
                />
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
                  disabled={loading || uploadingImage}
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

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Import từ vựng từ Excel
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
              {/* Hướng dẫn */}
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <p>
                  <strong>Yêu cầu file Excel:</strong>
                </p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>
                    Các cột bắt buộc: <strong>word</strong>,{" "}
                    <strong>meaning</strong>
                  </li>
                  <li>
                    Các cột tùy chọn: pronunciation, topic, reading_hiragana,
                    example_sentence, example_translation, image_url
                  </li>
                  <li>Hàng đầu tiên là tiêu đề cột (không import)</li>
                  <li>Định dạng: .xlsx hoặc .xls</li>
                </ul>
              </div>

              {/* Upload file */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
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

              {/* Lỗi */}
              {importError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {importError}
                </div>
              )}

              {/* Preview dữ liệu */}
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

              {/* Actions */}
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
                      Import {importData.length} từ
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

export default VocabularyManagement;

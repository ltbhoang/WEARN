// src/components/admin/LessonManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAdminLessonStore } from '../../store/adminStore';
import { useAdminKanjiStore } from '../../store/adminStore';
import { axiosPrivate } from '../../apis/axios';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  BookOpen, 
  X,
  Check,
  Eye,
  Sparkles,
  Loader,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

const LessonManagement = () => {
  const { 
    lessons, 
    fetchLessons, 
    createLesson, 
    updateLesson, 
    deleteLesson,
    getLessonDetail,
  } = useAdminLessonStore();

  // State cho Kanji tự fetch (vượt phân trang)
  const [allKanjis, setAllKanjis] = useState([]);
  const [loadingKanjis, setLoadingKanjis] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  
  // Tabs chính
  const [activeTab, setActiveTab] = useState('kana');
  // Sub tabs
  const [kanaSubTab, setKanaSubTab] = useState('hiragana');
  const [selectedJlpt, setSelectedJlpt] = useState('N5');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    totalKanji: 0,
    lessonsToCreate: 0,
    lessonSize: 5,
  });

  // Modal thông báo
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState({
    title: '',
    message: '',
    details: [],
  });

  // Fetch toàn bộ Kanji (vượt phân trang)
  const fetchAllKanjis = async () => {
    setLoadingKanjis(true);
    let page = 1;
    let all = [];
    let hasMore = true;
    const perPage = 100;

    try {
      while (hasMore) {
        const response = await axiosPrivate.get('/api/kanjis/', {
          params: { page, page_size: perPage }
        });
        const data = response.data;
        const results = data.results || data;
        if (Array.isArray(results)) {
          all = all.concat(results);
        } else {
          all = all.concat(data);
          break;
        }
        hasMore = !!data.next;
        page++;
      }
      setAllKanjis(all);
    } catch (error) {
      console.error('Lỗi fetch Kanji:', error);
    } finally {
      setLoadingKanjis(false);
    }
  };

  useEffect(() => {
    fetchLessons();
    fetchAllKanjis();
  }, []);

  // Hàm hiển thị modal thông báo
  const showInfo = (title, message, details = []) => {
    setInfoData({ title, message, details });
    setShowInfoModal(true);
  };

  // --- Lọc bài học theo tab ---

  // 1. Lọc Kana theo loại
  const filteredKanaLessons = useMemo(() => {
    const kanaLessons = lessons.filter(l => l.kanas && l.kanas.length > 0);
    if (kanaSubTab === 'hiragana') {
      return kanaLessons.filter(l => l.kanas.every(k => k.type === 'hiragana'));
    } else {
      return kanaLessons.filter(l => l.kanas.every(k => k.type === 'katakana'));
    }
  }, [lessons, kanaSubTab]);

  // 2. Lọc Kanji theo JLPT
  const filteredKanjis = useMemo(() => {
    return allKanjis.filter(k => k.jlpt_level === selectedJlpt);
  }, [allKanjis, selectedJlpt]);

  // 3. Lọc bài học Kanji theo level (chỉ hiện bài có tất cả Kanji cùng level)
  const filteredKanjiLessons = useMemo(() => {
    return lessons.filter(l => {
      if (!l.kanjis || l.kanjis.length === 0) return false;
      return l.kanjis.every(k => k.jlpt_level === selectedJlpt);
    });
  }, [lessons, selectedJlpt]);

  // 4. Bài học sẽ hiển thị trong bảng
  const filteredLessons = useMemo(() => {
    if (activeTab === 'kana') return filteredKanaLessons;
    return filteredKanjiLessons;
  }, [activeTab, filteredKanaLessons, filteredKanjiLessons]);

  // 5. Kanji chưa được gán trong danh sách đã lọc (theo JLPT)
  const unassignedKanji = useMemo(() => {
    const assignedIds = new Set();
    lessons.forEach(l => {
      if (l.kanjis && l.kanjis.length > 0) {
        l.kanjis.forEach(k => assignedIds.add(k.id));
      }
    });
    return filteredKanjis.filter(k => !assignedIds.has(k.id));
  }, [filteredKanjis, lessons]);

  const totalUnassigned = unassignedKanji.length;

  // Phân trang
  const totalItems = filteredLessons.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredLessons.slice(start, end);
  }, [filteredLessons, currentPage, pageSize]);

  // Reset trang khi đổi tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, kanaSubTab, selectedJlpt]);

  // Helper hiển thị
  const getKanaCharacters = (kanas) => {
    if (!kanas || kanas.length === 0) return '—';
    return kanas.map(k => k.character).join(', ');
  };

  const getKanjiCharacters = (kanjis) => {
    if (!kanjis || kanjis.length === 0) return '—';
    return kanjis.map(k => k.character).join(', ');
  };

  const getLessonType = (lesson) => {
    if (activeTab === 'kanji') return 'kanji';
    if (!lesson.kanas || lesson.kanas.length === 0) return null;
    const types = new Set(lesson.kanas.map(k => k.type));
    if (types.size === 1) return [...types][0];
    return 'mixed';
  };

  const getTypeBadgeColor = (type) => {
    if (type === 'kanji') return 'bg-indigo-100 text-indigo-700';
    switch (type) {
      case 'hiragana': return 'bg-pink-100 text-pink-700';
      case 'katakana': return 'bg-blue-100 text-blue-700';
      case 'mixed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getTypeLabel = (type) => {
    if (type === 'kanji') return 'Kanji';
    if (type === 'hiragana') return 'Hiragana';
    if (type === 'katakana') return 'Katakana';
    if (type === 'mixed') return 'Hỗn hợp';
    return '';
  };

  // Xóa tất cả bài học Kanji
  const handleDeleteAllKanjiLessons = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa TẤT CẢ bài học Kanji? Hành động này không thể hoàn tác.')) return;
    const kanjiLessons = lessons.filter(l => l.name.startsWith('Kanji'));
    if (kanjiLessons.length === 0) {
      showInfo('Thông báo', 'Không có bài học Kanji nào để xóa.');
      return;
    }
    try {
      for (const lesson of kanjiLessons) {
        await deleteLesson(lesson.id);
      }
      await fetchLessons();
      showInfo('✅ Xóa thành công', `Đã xóa ${kanjiLessons.length} bài học Kanji.`);
    } catch (error) {
      console.error('Lỗi xóa bài học Kanji:', error);
      showInfo('❌ Xóa thất bại', 'Không thể xóa bài học Kanji.', [error.message]);
    }
  };

  // Mở modal xác nhận
  const handleOpenConfirm = () => {
    if (totalUnassigned === 0) {
      showInfo(
        '✅ Thông báo',
        `Tất cả Kanji ${selectedJlpt} đã được phân vào bài học. Không cần tạo thêm.`
      );
      return;
    }
    const lessonSize = 5;
    const lessonsToCreate = Math.ceil(totalUnassigned / lessonSize);
    setConfirmData({
      totalKanji: totalUnassigned,
      lessonsToCreate: lessonsToCreate,
      lessonSize: lessonSize,
    });
    setShowConfirmModal(true);
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    setShowConfirmModal(false);
    try {
      const kanjiIds = unassignedKanji.map(k => k.id);
      const response = await axiosPrivate.post('/api/lessons/auto-generate-kanji-lessons/', {
        lesson_size: 5,
        kanji_ids: kanjiIds,
        name_prefix: `Kanji ${selectedJlpt}`
      });
      
      const { lessons_created, total_kanji, errors } = response.data;
      
      // Kiểm tra nếu có lỗi từ backend
      if (errors && errors.length > 0) {
        const errorDetails = errors.map(e => 
          `- ${e.character || 'Kanji'}: ${Object.values(e.errors).join(', ')}`
        );
        showInfo(
          '⚠️ Tạo bài học có lỗi',
          `Đã tạo ${lessons_created} bài học, nhưng có ${errors.length} Kanji bị lỗi:`,
          errorDetails
        );
        await fetchLessons();
        return;
      }
      
      showInfo(
        '✅ Tạo bài học thành công',
        `Đã tạo ${lessons_created} bài học Kanji ${selectedJlpt} (tổng ${total_kanji} Kanji mới)!`
      );
      await fetchLessons();
    } catch (error) {
      console.error('Lỗi tạo bài học tự động:', error);
      const errorMsg = error.response?.data?.message || error.message;
      showInfo(
        '❌ Tạo bài học thất bại',
        'Không thể tạo bài học tự động',
        [errorMsg]
      );
    } finally {
      setAutoGenerating(false);
    }
  };

  // CRUD handlers
  const handleOpenModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({ name: lesson.name, description: lesson.description || '' });
    } else {
      setEditingLesson(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, formData);
      } else {
        await createLesson(formData);
      }
      handleCloseModal();
      await fetchLessons();
    } catch (error) {
      console.error('Lỗi khi lưu lesson:', error);
      showInfo('Lỗi', 'Có lỗi xảy ra khi lưu bài học.', [error.message]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bài học này?')) {
      try {
        await deleteLesson(id);
        await fetchLessons();
      } catch (error) {
        console.error('Lỗi khi xóa lesson:', error);
        showInfo('Lỗi', 'Không thể xóa bài học này.', [error.message]);
      }
    }
  };

  const handleViewDetail = async (lesson) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const detail = await getLessonDetail(lesson.id);
      setSelectedLesson(detail);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết bài học:', error);
      showInfo('Lỗi', 'Không thể tải chi tiết bài học.', [error.message]);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedLesson(null);
  };

  const getCharacters = (lesson) => {
    if (activeTab === 'kanji') {
      return getKanjiCharacters(lesson.kanjis);
    }
    return getKanaCharacters(lesson.kanas);
  };

  const getCount = (lesson) => {
    if (activeTab === 'kanji') {
      return lesson.kanjis?.length || 0;
    }
    return lesson.kanas?.length || 0;
  };

  const isGenerateDisabled = autoGenerating || loadingKanjis || totalUnassigned === 0;

  // Màu sắc cho các button JLPT
  const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const levelColors = {
    N5: 'bg-green-100 text-green-700 hover:bg-green-200',
    N4: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    N3: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    N2: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    N1: 'bg-red-100 text-red-700 hover:bg-red-200',
  };
  const activeLevelColors = {
    N5: 'bg-green-600 text-white',
    N4: 'bg-blue-600 text-white',
    N3: 'bg-yellow-600 text-white',
    N2: 'bg-orange-600 text-white',
    N1: 'bg-red-600 text-white',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#E85A4F]" />
          Quản lý bài học
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          {activeTab === 'kanji' && (
            <>
              <button
                onClick={handleOpenConfirm}
                disabled={isGenerateDisabled}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {autoGenerating ? 'Đang tạo...' : `Tạo bài học Kanji ${selectedJlpt}`}
              </button>
              <button
                onClick={handleDeleteAllKanjiLessons}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tất cả Kanji
              </button>
            </>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#E85A4F] hover:bg-[#d94a3f] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm bài học
          </button>
        </div>
      </div>

      {/* Tabs chính */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('kana')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'kana'
              ? 'border-[#E85A4F] text-[#E85A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Kana ({lessons.filter(l => l.kanas && l.kanas.length > 0).length})
        </button>
        <button
          onClick={() => setActiveTab('kanji')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'kanji'
              ? 'border-[#E85A4F] text-[#E85A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Kanji ({lessons.filter(l => l.kanjis && l.kanjis.length > 0).length})
        </button>
      </div>

      {/* Sub tabs Kana - dạng button màu */}
      {activeTab === 'kana' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {['hiragana', 'katakana'].map(type => {
            const count = lessons.filter(l => 
              l.kanas && l.kanas.length > 0 && l.kanas.every(k => k.type === type)
            ).length;
            const isActive = kanaSubTab === type;
            const color = type === 'hiragana' 
              ? { bg: 'bg-pink-100', active: 'bg-pink-600', text: 'text-pink-700', activeText: 'text-white' }
              : { bg: 'bg-blue-100', active: 'bg-blue-600', text: 'text-blue-700', activeText: 'text-white' };
            return (
              <button
                key={type}
                onClick={() => setKanaSubTab(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  isActive 
                    ? `${color.active} ${color.activeText}` 
                    : `${color.bg} ${color.text} hover:opacity-80`
                }`}
              >
                {type === 'hiragana' ? 'Hiragana' : 'Katakana'} 
                <span className="ml-1 text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sub tabs Kanji - dạng button màu */}
      {activeTab === 'kanji' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {jlptLevels.map(level => {
            const count = allKanjis.filter(k => k.jlpt_level === level).length;
            const isActive = selectedJlpt === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedJlpt(level)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  isActive ? activeLevelColors[level] : levelColors[level]
                }`}
              >
                {level} <span className="ml-1 text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bảng danh sách bài học */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          {lessons.length === 0 
            ? 'Chưa có bài học nào. Hãy tạo bài học mới.' 
            : `Không có bài học ${activeTab === 'kana' ? (kanaSubTab === 'hiragana' ? 'Hiragana' : 'Katakana') : `Kanji ${selectedJlpt}`} nào.`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ký tự</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLessons.map((lesson) => {
                const type = getLessonType(lesson);
                return (
                  <tr key={lesson.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-slate-700">{lesson.name}</td>
                    <td className="px-4 py-4">
                      {type && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getTypeBadgeColor(type)}`}>
                          {getTypeLabel(type)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {getCharacters(lesson)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">{getCount(lesson)}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(lesson)}
                          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(lesson)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} / {totalItems} bài học
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLesson ? 'Sửa bài học' : 'Thêm bài học mới'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tên bài học *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/30 focus:border-[#E85A4F] transition-all"
                    placeholder="Nhập tên bài học"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/30 focus:border-[#E85A4F] transition-all resize-none"
                    rows="3"
                    placeholder="Mô tả ngắn về bài học"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#E85A4F] hover:bg-[#d94a3f] text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingLesson ? 'Cập nhật' : 'Thêm mới'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#E85A4F]" />
                Chi tiết bài học: {selectedLesson?.name || ''}
              </h3>
              <button onClick={handleCloseDetail} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {selectedLesson?.description && (
              <p className="text-sm text-slate-500 mb-4">{selectedLesson.description}</p>
            )}
            <div className="flex-1 overflow-y-auto">
              {selectedLesson?.kanjis && selectedLesson.kanjis.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Danh sách Kanji</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Ký tự</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Nghĩa</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Onyomi</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Kunyomi</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">Số nét</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLesson.kanjis.map((kanji, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 text-sm font-medium text-slate-700">{kanji.character}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">{kanji.meaning || '-'}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">{kanji.onyomi || '-'}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">{kanji.kunyomi || '-'}</td>
                            <td className="px-4 py-2 text-sm text-slate-500 text-center">{kanji.total_strokes || kanji.stroke_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedLesson?.kanas && selectedLesson.kanas.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Danh sách Kana</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Ký tự</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Loại</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Romaji</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Số nét</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLesson.kanas.map((kana, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 text-sm font-medium text-slate-700">{kana.character}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">{kana.type}</td>
                            <td className="px-4 py-2 text-sm text-slate-500">{kana.romanji}</td>
                            <td className="px-4 py-2 text-sm text-slate-500 text-center">{kana.total_strokes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Bài học chưa có Kana hoặc Kanji.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={handleCloseDetail} className="bg-[#E85A4F] hover:bg-[#d94a3f] text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận tạo bài học */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xác nhận tạo bài học</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Sẽ tạo <strong>{confirmData.lessonsToCreate}</strong> bài học Kanji tự động.</p>
              <p>Mỗi bài gồm <strong>{confirmData.lessonSize}</strong> Kanji.</p>
              <p>Số Kanji chưa được gán: <strong>{confirmData.totalKanji}</strong>.</p>
              <p className="text-xs text-slate-400 mt-2">* Các bài học đã tồn tại sẽ được cập nhật lại danh sách Kanji.</p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={autoGenerating}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {autoGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {autoGenerating ? 'Đang tạo...' : 'Tạo bài học'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông báo */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{infoData.title}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">{infoData.message}</p>
            {infoData.details.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg max-h-40 overflow-y-auto text-sm text-slate-600 space-y-1">
                {infoData.details.map((detail, idx) => (
                  <div key={idx}>{detail}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-[#E85A4F] hover:bg-[#d94a3f] text-white rounded-xl text-sm font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManagement;
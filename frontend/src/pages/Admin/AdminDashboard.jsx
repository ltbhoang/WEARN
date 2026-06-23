import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Type, 
  Book,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { 
  useAdminVocabularyStore,
  useAdminLessonStore,
  useAdminKanjiStore,
  useAdminUserStore
} from '../../store/adminStore';

// Copy topicMap từ VocabularyManagement vào đây
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
  if (!topic) return "Khác";
  return topicMap[topic] || topic.charAt(0).toUpperCase() + topic.slice(1);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const { vocabularies, fetchVocabularies, pagination: vocabPagination } = useAdminVocabularyStore();
  const { lessons, fetchLessons } = useAdminLessonStore();
  const { kanjis, fetchKanjis, pagination: kanjiPagination } = useAdminKanjiStore();
  const { users, fetchUsers, pagination: userPagination } = useAdminUserStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchVocabularies({ page: 1, page_size: 50 }),
          fetchLessons(),
          fetchKanjis({ page: 1, page_size: 50 }),
          fetchUsers({ page: 1, page_size: 50 })
        ]);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổng quan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [fetchVocabularies, fetchLessons, fetchKanjis, fetchUsers]);

  const totalVocab = vocabPagination?.totalItems || 0;
  const totalKanji = kanjiPagination?.totalItems || 0;
  const totalUsers = userPagination?.totalItems || 0;
  const totalLessons = lessons?.length || 0;

  // Lấy 5 mục mới nhất từ mỗi bảng
  const latestVocabs = useMemo(() => {
    return Array.isArray(vocabularies) ? vocabularies.slice(0, 5) : [];
  }, [vocabularies]);

  const latestKanjis = useMemo(() => {
    return Array.isArray(kanjis) ? kanjis.slice(0, 5) : [];
  }, [kanjis]);

  const latestLessons = useMemo(() => {
    return Array.isArray(lessons) ? lessons.slice(0, 5) : [];
  }, [lessons]);

  // Thống kê nhanh
  const quickStats = [
    { label: 'Từ vựng', value: totalVocab, icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-500' },
    { label: 'Kanji', value: totalKanji, icon: <Type className="w-4 h-4" />, color: 'bg-violet-500' },
    { label: 'Bài học', value: totalLessons, icon: <Book className="w-4 h-4" />, color: 'bg-emerald-500' },
    { label: 'Người dùng', value: totalUsers, icon: <Users className="w-4 h-4" />, color: 'bg-amber-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#E85A4F]"></div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider">ĐANG ĐỒNG BỘ DỮ LIỆU...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">Dữ liệu phân tích trạng thái thời gian thực của nền tảng.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl self-start sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Hệ thống ổn định
        </div>
      </div>

      {/* Grid Cards thống kê chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">{stat.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl text-white ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Dữ liệu mới nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Từ vựng mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Từ vựng mới nhất
          </h2>
          <div className="flex-1 space-y-3">
            {latestVocabs.length > 0 ? (
              latestVocabs.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{v.word || '---'}</p>
                    <p className="text-xs text-slate-400">{v.meaning || 'Chưa có nghĩa'}</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {formatTopic(v.topic)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Chưa có từ vựng nào.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/admin/vocabularies')}
            className="mt-4 text-xs font-bold text-[#E85A4F] hover:underline self-end"
          >
            Xem tất cả →
          </button>
        </div>

        {/* Kanji mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <Type className="w-4 h-4 text-violet-500" />
            Kanji mới nhất
          </h2>
          <div className="flex-1 space-y-3">
            {latestKanjis.length > 0 ? (
              latestKanjis.map(k => (
                <div key={k.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{k.character || '---'}</p>
                    <p className="text-xs text-slate-400">{k.meaning || 'Chưa có nghĩa'}</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {k.jlpt_level || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Chưa có Kanji nào.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/admin/kanjis')}
            className="mt-4 text-xs font-bold text-[#E85A4F] hover:underline self-end"
          >
            Xem tất cả →
          </button>
        </div>

        {/* Bài học mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <Book className="w-4 h-4 text-emerald-500" />
            Bài học mới nhất
          </h2>
          <div className="flex-1 space-y-3">
            {latestLessons.length > 0 ? (
              latestLessons.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{l.name || '---'}</p>
                    <p className="text-xs text-slate-400">
                      {l.kanas?.length || 0} Kana · {l.kanjis?.length || 0} Kanji
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    #{l.order || 0}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Chưa có bài học nào.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/admin/lessons')}
            className="mt-4 text-xs font-bold text-[#E85A4F] hover:underline self-end"
          >
            Xem tất cả →
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
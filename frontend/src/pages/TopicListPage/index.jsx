import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Grid3x3, Image as ImageIcon, Loader2 } from "lucide-react";
import { useVocabStore } from "../../store/vocabStore";
import { localTopicImageMap } from "../../constants/topicImages";

// ---------- Định nghĩa 12 nhóm chủ đề hợp lý (dựa trên từ vựng N5) ----------
const GROUP_MAPPING = {
  "Đại từ & Từ để hỏi": ["daitu", "nghevan", "tunghevan", "tu_noi"],
  "Gia đình & Quan hệ": ["giadinh", "connguoi"],
  "Cuộc sống & Nhà cửa": ["nhacua", "dovan", "dodung", "vesinh"],
  "Ăn uống & Thực phẩm": ["doan", "thit", "rau", "luongthuc", "giavi"],
  "Động vật & Thiên nhiên": ["dongvat", "thiennhien", "mua", "thoitiet"],
  "Thời gian": ["thoigian"],
  "Địa điểm & Phương hướng": [
    "diadiem",
    "thanhpho",
    "vitri",
    "huong",
    "kientruc",
  ],
  "Giao thông & Du lịch": ["giaothong"],
  "Hành động (Động từ)": ["dongtu"],
  "Tính chất (Tính từ)": ["tinhtu", "tinhtu_i", "tinhtu_na", "trangthai"],
  "Trường học & Công việc": [
    "hoc_tap",
    "truonghoc",
    "giaoduc",
    "nghenghiep",
    "congty",
    "it",
  ],
  "Màu sắc & Đồ vật & Khác": [
    "mausac",
    "quanao",
    "phukien",
    "dovat",
    "vatlieu",
    "khac",
    "sodem",
    "trangtu",
    "sothich",
    "giaitri",
    "extra",
  ],
};

const GROUP_ORDER = [
  "Gia đình & Quan hệ",
  "Cuộc sống & Nhà cửa",
  "Ăn uống & Thực phẩm",
  "Thời gian",
  "Động vật & Thiên nhiên",
  "Địa điểm & Phương hướng",
  "Giao thông & Du lịch",
  "Hành động (Động từ)",
  "Tính chất (Tính từ)",
  "Đại từ & Từ để hỏi",
  "Trường học & Công việc",
  "Màu sắc & Đồ vật & Khác",
];

// Map ngược topic -> tên nhóm
const topicToGroup = {};
Object.entries(GROUP_MAPPING).forEach(([groupName, topics]) => {
  topics.forEach((topic) => {
    topicToGroup[topic] = groupName;
  });
});

// ---------- Gán ảnh local cho từng nhóm (cập nhật theo nhóm mới) ----------
const groupImageMap = {
  "Đại từ & Từ để hỏi": localTopicImageMap["daitu"],
  "Gia đình & Quan hệ":
    localTopicImageMap["giadinh"] || localTopicImageMap["connguoi"],
  "Cuộc sống & Nhà cửa":
    localTopicImageMap["nhacua"] || localTopicImageMap["dodung"],
  "Ăn uống & Thực phẩm": localTopicImageMap["doan"],
  "Thời gian": localTopicImageMap["thoigian"],
  "Động vật & Thiên nhiên":
    localTopicImageMap["thegioi"] || localTopicImageMap["dongvat"],
  "Địa điểm & Phương hướng":
    localTopicImageMap["diadiem"] || localTopicImageMap["giaothong"],
  "Giao thông & Du lịch": localTopicImageMap["giaothong"],
  "Hành động (Động từ)": localTopicImageMap["dongtu"],
  "Tính chất (Tính từ)": localTopicImageMap["trangthai"],
  "Trường học & Công việc":
    localTopicImageMap["congty"] || localTopicImageMap["nghenghiep"],
  "Màu sắc & Đồ vật & Khác":
    localTopicImageMap["dodung"] || localTopicImageMap["mausac"],
};

const TopicListPage = () => {
  const navigate = useNavigate();
  const { topics, loading, error, fetchTopicsWithImages } = useVocabStore();

  useEffect(() => {
    fetchTopicsWithImages();
  }, [fetchTopicsWithImages]);

  const groupedTopics = useMemo(() => {
    if (!topics.length) return [];

    const groupsMap = new Map();

    topics.forEach((topic) => {
      const groupName = topicToGroup[topic.id];
      if (!groupName) return;

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, {
          id: groupName,
          image: groupImageMap[groupName],
          topics: [topic.id],
        });
      } else {
        const group = groupsMap.get(groupName);
        group.topics.push(topic.id);
      }
    });

    const result = Array.from(groupsMap.values());
    result.sort((a, b) => {
      const idxA = GROUP_ORDER.indexOf(a.id);
      const idxB = GROUP_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
    return result;
  }, [topics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#E85A4F] animate-spin" />
        <p className="text-[#8E8D8A] font-medium animate-pulse">
          Đang chuẩn bị bài học...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <p className="text-red-600 font-bold mb-2">Đã xảy ra lỗi</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchTopicsWithImages()}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-28 font-sans">
      <header className="px-6 pt-12 pb-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-[#E85A4F] font-bold flex items-center gap-1 hover:-translate-x-1 transition-transform"
        >
          ← Quay lại
        </button>
        <h1 className="text-4xl font-black text-[#474747] tracking-tight">
          Chủ đề từ vựng
        </h1>
        <p className="text-[#8E8D8A] mt-2 text-lg">
          Chọn một nhóm chủ đề để bắt đầu ôn luyện
        </p>
      </header>

      <main className="px-6 max-w-5xl mx-auto">
        {groupedTopics.length === 0 ? (
          <div className="text-center py-20">
            <Grid3x3 size={64} className="mx-auto mb-4 text-[#8E8D8A]/20" />
            <p className="text-[#8E8D8A]">Không tìm thấy nhóm chủ đề nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedTopics.map((group) => (
              <div
                key={group.id}
                onClick={() =>
                  navigate(`/vocabulary/group/${encodeURIComponent(group.id)}`)
                }
                className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-95 bg-white border border-white/20"
              >
                {group.image ? (
                  <img
                    src={group.image}
                    alt={group.id}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E85A4F]/10 to-[#E98074]/5 flex items-center justify-center">
                    <ImageIcon className="text-[#E85A4F]/20" size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-white">
                  <div className="flex justify-between items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-black leading-tight break-words line-clamp-2">
                        {group.id}
                      </h2>
                      <span className="text-[10px] text-white/70 mt-0.5 block">
                        {group.topics.length} chủ đề nhỏ
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-full text-[#E85A4F] scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TopicListPage;

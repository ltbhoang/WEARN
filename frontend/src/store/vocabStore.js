// store/vocabStore.js
import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useVocabStore = create((set, get) => ({
  // --- STATE ---
  topics: [], // danh sách các topic (chủ đề)
  currentTopic: null, // topic đang được chọn (để hiển thị)
  vocabularies: [], // danh sách từ vựng của topic hiện tại
  currentVocabulary: null, // chi tiết một từ vựng (theo class_name)
  searchResults: [], // kết quả tìm kiếm
  loading: false,
  error: null,

  // --- ACTIONS ---

  // Lấy danh sách tất cả topic
  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/vocabularies/topics/");
      set({ topics: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách chủ đề",
        loading: false,
      });
      throw err;
    }
  },

  // Lấy từ vựng theo topic (ví dụ: ?topic=tinhtu)
  fetchVocabulariesByTopic: async (topic) => {
    set({ loading: true, error: null, currentTopic: topic });
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/?topic=${topic}`
      );
      set({ vocabularies: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể tải từ vựng theo chủ đề",
        loading: false,
      });
      throw err;
    }
  },

  // Lấy chi tiết một từ vựng theo class_name (ví dụ: /api/vocabularies/n5_adj_abunai/)
  fetchVocabularyDetail: async (className) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/${className}/`
      );
      set({ currentVocabulary: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải chi tiết từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  // Thêm vào trong create((set, get) => ({ ... }))
  fetchTopicsWithImages: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Lấy danh sách tên topic trước
      const resTopics = await axiosPrivate.get("/api/vocabularies/topics/");
      const topicList = resTopics.data;

      // 2. Với mỗi topic, lấy danh sách từ vựng để lấy ảnh của từ đầu tiên
      const topicsWithData = await Promise.all(
        topicList.map(async (topic) => {
          try {
            const resVocab = await axiosPrivate.get(
              `/api/vocabularies/?topic=${topic}`
            );
            // Lấy ảnh của từ đầu tiên, nếu không có ảnh thì để null
            const firstImage =
              resVocab.data[0]?.image_url || resVocab.data[0]?.image || null;
            return { id: topic, image: firstImage };
          } catch {
            return { id: topic, image: null };
          }
        })
      );

      set({ topics: topicsWithData, loading: false });
    } catch (err) {
      set({ error: "Không thể tải danh sách chủ đề kèm ảnh", loading: false });
    }
  },

  // Tìm kiếm từ vựng (theo word, meaning, pronunciation)
  searchVocabulary: async (keyword) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/?search=${encodeURIComponent(keyword)}`
      );
      set({ searchResults: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tìm kiếm từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  // Reset current topic (khi thoát khỏi trang danh sách)
  resetCurrentTopic: () => {
    set({ currentTopic: null, vocabularies: [] });
  },

  // Reset chi tiết từ vựng
  resetCurrentVocabulary: () => {
    set({ currentVocabulary: null });
  },

  // Xóa thông báo lỗi
  clearError: () => set({ error: null }),
}));

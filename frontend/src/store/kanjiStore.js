// src/store/useKanjiStore.js
import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useKanjiStore = create((set, get) => ({
  // Danh sách bài học có Kanji
  lessons: [],
  // Chi tiết Kanji đang xem/luyện
  currentKanji: null,
  // Tiến độ vẽ nét của user cho từng Kanji (key: kanjiId)
  kanjiProgress: {},
  loading: false,
  error: null,

  // ----- Lấy danh sách bài học có chứa Kanji -----
  fetchLessons: async () => {
    set({ loading: true, error: null });
    try {
      // Lấy tất cả bài học, filter lấy những bài có kanjis
      const response = await axiosPrivate.get("/api/lessons/", {
        params: { page_size: 1000 },
      });
      let lessonsData = response.data.results || response.data || [];
      // Chỉ giữ lại bài học có Kanji
      lessonsData = lessonsData.filter((lesson) => lesson.kanjis && lesson.kanjis.length > 0);
      set({ lessons: lessonsData, loading: false });
      return lessonsData;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách bài học Kanji",
        loading: false,
      });
      throw err;
    }
  },

  // ----- Lấy chi tiết một Kanji -----
  fetchKanjiDetail: async (kanjiId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kanji/${kanjiId}/`);
      set({ currentKanji: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải chi tiết Kanji",
        loading: false,
      });
      throw err;
    }
  },

  // ----- Lấy tiến độ vẽ nét của user cho một Kanji -----
  fetchKanjiProgress: async (kanjiId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kanji-progress/${kanjiId}/`);
      set((state) => ({
        kanjiProgress: {
          ...state.kanjiProgress,
          [kanjiId]: response.data,
        },
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải tiến độ Kanji",
        loading: false,
      });
      throw err;
    }
  },

  // ----- Lấy tiến độ (có cache) -----
  getKanjiProgress: async (kanjiId) => {
    const progress = get().kanjiProgress[kanjiId];
    if (progress) return progress;
    return await get().fetchKanjiProgress(kanjiId);
  },

  // ----- Hoàn thành một nét của Kanji -----
  completeStroke: async (kanjiId, strokeIndex, userSvg) => {
    try {
      const response = await axiosPrivate.post("/api/complete-kanji-stroke/", {
        kanji_id: kanjiId,
        stroke_index: strokeIndex,
        user_svg: userSvg,
      });

      const { completed, completed_strokes } = response.data;

      set((state) => ({
        kanjiProgress: {
          ...state.kanjiProgress,
          [kanjiId]: {
            completed_strokes: completed_strokes,
            completed: completed,
          },
        },
      }));
      return response.data;
    } catch (err) {
      console.error("Store error:", err.response?.data);
      throw err;
    }
  },

  // ----- Đánh dấu hoàn thành một bài học Kanji -----
  completeLesson: async (lessonId) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.post(`/api/lessons/${lessonId}/complete/`);
      // Sau khi hoàn thành, reload danh sách để cập nhật trạng thái
      await get().fetchLessons();
      set({ loading: false });
    } catch (err) {
      set({
        error:
          err.response?.data?.message ||
          "Không thể đánh dấu bài học Kanji đã hoàn thành",
        loading: false,
      });
      throw err;
    }
  },

  // ----- Reset chi tiết Kanji hiện tại -----
  resetCurrentKanji: () => {
    set({ currentKanji: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // ----- Tiện ích lấy số nét đã hoàn thành -----
  getCompletedStrokeCount: (kanjiId) => {
    const progress = get().kanjiProgress[kanjiId];
    return progress ? progress.completed_strokes.length : 0;
  },

  // ----- Kiểm tra xem Kanji đã hoàn thành chưa -----
  isKanjiCompleted: (kanjiId) => {
    const progress = get().kanjiProgress[kanjiId];
    return progress ? progress.completed : false;
  },
}));
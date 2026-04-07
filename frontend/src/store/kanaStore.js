import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useKanaStore = create((set, get) => ({
  // --- STATE ---
  lessons: [], // danh sách bài học
  currentKana: null, // chi tiết kana đang được chọn (bao gồm strokes)
  kanaProgress: {}, // object map: { kanaId: { completed_strokes: [], completed: false } }
  loading: false,
  error: null,

  // --- ACTIONS CHO LESSONS ---
  fetchLessons: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/lessons/");
      set({ lessons: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách bài học",
        loading: false,
      });
      throw err;
    }
  },

  // --- ACTIONS CHO KANA DETAIL ---
  fetchKanaDetail: async (kanaId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kana/${kanaId}/`);
      set({ currentKana: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải chi tiết kana",
        loading: false,
      });
      throw err;
    }
  },

  // --- ACTIONS CHO KANA PROGRESS ---
  fetchKanaProgress: async (kanaId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kana-progress/${kanaId}/`);
      // Lưu progress vào map
      set((state) => ({
        kanaProgress: {
          ...state.kanaProgress,
          [kanaId]: response.data,
        },
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải tiến độ kana",
        loading: false,
      });
      throw err;
    }
  },

  // Lấy progress từ store (nếu chưa có thì tự động fetch)
  getKanaProgress: async (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    if (progress) return progress;
    return await get().fetchKanaProgress(kanaId);
  },

  // --- ACTIONS CHO COMPLETE STROKE ---
  // Trong useKanaStore (kanaStore.js)
  completeStroke: async (kanaId, strokeIndex, userSvg) => {
    // Không set loading = true ở đây để tránh chặn UI
    try {
      const response = await axiosPrivate.post("/api/complete-stroke/", {
        kana_id: parseInt(kanaId), // Đảm bảo là ID số
        stroke_index: strokeIndex,
        user_svg: userSvg, // Gửi chuỗi ngắn thôi, đừng gửi Base64 ảnh canvas quá dài
      });

      const { completed, completed_strokes } = response.data;

      // Cập nhật progress vào Store
      set((state) => ({
        kanaProgress: {
          ...state.kanaProgress,
          [kanaId]: {
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

  // --- ACTIONS CHO LESSON COMPLETION ---
  completeLesson: async (lessonId) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.post(`/api/lessons/${lessonId}/complete/`);
      // Cập nhật lại danh sách lessons để đánh dấu bài đã hoàn thành
      await get().fetchLessons();
      set({ loading: false });
    } catch (err) {
      set({
        error:
          err.response?.data?.message ||
          "Không thể đánh dấu bài học đã hoàn thành",
        loading: false,
      });
      throw err;
    }
  },

  // --- HELPER FUNCTIONS ---
  resetCurrentKana: () => {
    set({ currentKana: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // Lấy số nét đã hoàn thành của một kana (từ progress)
  getCompletedStrokeCount: (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    return progress ? progress.completed_strokes.length : 0;
  },

  // Kiểm tra xem một kana đã hoàn thành chưa
  isKanaCompleted: (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    return progress ? progress.completed : false;
  },
}));

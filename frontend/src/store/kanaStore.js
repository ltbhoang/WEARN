import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useKanaStore = create((set, get) => ({
  lessons: [], 
  currentKana: null, 
  kanaProgress: {}, 
  loading: false,
  error: null,

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

  fetchKanaProgress: async (kanaId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kana-progress/${kanaId}/`);
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

  getKanaProgress: async (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    if (progress) return progress;
    return await get().fetchKanaProgress(kanaId);
  },

  completeStroke: async (kanaId, strokeIndex, userSvg) => {
    try {
      const response = await axiosPrivate.post("/api/complete-stroke/", {
        kana_id: parseInt(kanaId), 
        stroke_index: strokeIndex,
        user_svg: userSvg,
      });

      const { completed, completed_strokes } = response.data;

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

  completeLesson: async (lessonId) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.post(`/api/lessons/${lessonId}/complete/`);
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

  resetCurrentKana: () => {
    set({ currentKana: null });
  },

  clearError: () => {
    set({ error: null });
  },

  getCompletedStrokeCount: (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    return progress ? progress.completed_strokes.length : 0;
  },

  isKanaCompleted: (kanaId) => {
    const progress = get().kanaProgress[kanaId];
    return progress ? progress.completed : false;
  },
}));
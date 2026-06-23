/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

// ============================================================
// 1. ADMIN VOCABULARY STORE (có phân trang)
// ============================================================
export const useAdminVocabularyStore = create((set, get) => ({
  vocabularies: [],
  currentVocabulary: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20,
  },

  fetchVocabularies: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/vocabularies/", { params });
      const { count, next, previous, results } = response.data;
      const pageSize = params.page_size || 20;
      const currentPage = params.page || 1;
      const totalPages = Math.ceil(count / pageSize);

      set({
        vocabularies: results,
        pagination: {
          currentPage,
          totalPages,
          totalItems: count,
          pageSize,
        },
        loading: false,
      });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  createVocabulary: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/vocabularies/", data);
      const { pagination } = get();
      await get().fetchVocabularies({
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        search: get().searchTerm || "",
      });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể thêm từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  updateVocabulary: async (class_name, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.put(
        `/api/vocabularies/${class_name}/`,
        data
      );
      const { pagination } = get();
      await get().fetchVocabularies({
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        search: get().searchTerm || "",
      });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  deleteVocabulary: async (class_name) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/vocabularies/${class_name}/`);
      const { pagination } = get();
      await get().fetchVocabularies({
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        search: get().searchTerm || "",
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa từ vựng",
        loading: false,
      });
      throw err;
    }
  },

  getVocabularyByClass: async (class_name) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/${class_name}/`
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

  searchTerm: "",

  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentVocabulary: null }),
}));

// ============================================================
// 2. ADMIN LESSON STORE (đã sửa fetchLessons)
// ============================================================
export const useAdminLessonStore = create((set, get) => ({
  lessons: [],
  currentLesson: null,
  loading: false,
  error: null,

  fetchLessons: async () => {
    set({ loading: true, error: null });
    try {
      // Lấy tất cả bài học với page_size lớn (1000) để không bị phân trang
      const response = await axiosPrivate.get("/api/lessons/", { params: { page_size: 1000 } });
      let lessonsData = response.data;
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        lessonsData = response.data.results || [];
      }
      set({ lessons: lessonsData, loading: false });
      return lessonsData;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách bài học",
        loading: false,
      });
      throw err;
    }
  },

  createLesson: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/lessons/", data);
      set((state) => ({
        lessons: [response.data, ...state.lessons],
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể thêm bài học",
        loading: false,
      });
      throw err;
    }
  },

  updateLesson: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.put(`/api/lessons/${id}/`, data);
      set((state) => ({
        lessons: state.lessons.map((l) => (l.id === id ? response.data : l)),
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật bài học",
        loading: false,
      });
      throw err;
    }
  },

  deleteLesson: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/lessons/${id}/`);
      set((state) => ({
        lessons: state.lessons.filter((l) => l.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa bài học",
        loading: false,
      });
      throw err;
    }
  },

  getLessonDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/lessons/${id}/`);
      set({ currentLesson: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải chi tiết bài học",
        loading: false,
      });
      throw err;
    }
  },

  autoGenerateKanjiLessons: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post(
        "/api/lessons/auto-generate-kanji-lessons/",
        params
      );
      set({ loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Lỗi tạo bài học tự động",
        loading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentLesson: null }),
}));

// ============================================================
// 3. ADMIN KANA STORE (giữ nguyên)
// ============================================================
export const useAdminKanaStore = create((set, get) => ({
  kanas: [],
  currentKana: null,
  loading: false,
  error: null,

  fetchKanas: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/kanas/", { params });
      set({ kanas: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách Kana",
        loading: false,
      });
      throw err;
    }
  },

  createKana: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/kanas/", data);
      set((state) => ({
        kanas: [response.data, ...state.kanas],
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể thêm Kana",
        loading: false,
      });
      throw err;
    }
  },

  updateKana: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.put(`/api/kanas/${id}/`, data);
      set((state) => ({
        kanas: state.kanas.map((k) => (k.id === id ? response.data : k)),
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật Kana",
        loading: false,
      });
      throw err;
    }
  },

  deleteKana: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/kanas/${id}/`);
      set((state) => ({
        kanas: state.kanas.filter((k) => k.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa Kana",
        loading: false,
      });
      throw err;
    }
  },

  getKanaDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kanas/${id}/`);
      set({ currentKana: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải chi tiết Kana",
        loading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentKana: null }),
}));

// ============================================================
// 4. ADMIN USER STORE (giữ nguyên)
// ============================================================
export const useAdminUserStore = create((set, get) => ({
  users: [],
  currentUser: null,
  loading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/admin/users/", { params });
      let usersData = response.data;
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data) &&
        response.data.results
      ) {
        usersData = response.data.results;
        set((state) => ({
          pagination: {
            currentPage: params.page || 1,
            totalItems: response.data.count || 0,
            totalPages: Math.ceil(
              (response.data.count || 0) / (params.page_size || 20)
            ),
            pageSize: params.page_size || 20,
          },
        }));
      }
      set({ users: usersData, loading: false });
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể tải danh sách người dùng",
        loading: false,
      });
      throw err;
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.patch(
        `/api/admin/users/${id}/`,
        data
      );
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? response.data : u)),
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật người dùng",
        loading: false,
      });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/admin/users/${id}/`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa người dùng",
        loading: false,
      });
      throw err;
    }
  },

  toggleActive: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post(
        `/api/admin/users/${id}/toggle_active/`
      );
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, is_active: response.data.is_active } : u
        ),
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message ||
          "Không thể thay đổi trạng thái người dùng",
        loading: false,
      });
      throw err;
    }
  },

  setPassword: async (id, password) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.post(`/api/admin/users/${id}/set_password/`, {
        password,
      });
      set({ loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể đặt lại mật khẩu",
        loading: false,
      });
      throw err;
    }
  },

  getUserDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/admin/users/${id}/`);
      set({ currentUser: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể tải chi tiết người dùng",
        loading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentUser: null }),
}));

// ============================================================
// 5. ADMIN KANJI STORE (giữ nguyên)
// ============================================================
export const useAdminKanjiStore = create((set, get) => ({
  kanjis: [],
  currentKanji: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20,
  },

  fetchKanjis: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/kanjis/", { params });
      if (response.data.results) {
        const { count, next, previous, results } = response.data;
        const pageSize = params.page_size || 20;
        const currentPage = params.page || 1;
        const totalPages = Math.ceil(count / pageSize);
        set({
          kanjis: results,
          pagination: {
            currentPage,
            totalPages,
            totalItems: count,
            pageSize,
          },
          loading: false,
        });
      } else {
        set({ kanjis: response.data, loading: false });
      }
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tải danh sách Kanji",
        loading: false,
      });
      throw err;
    }
  },

  createKanji: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/kanjis/", data);
      set((state) => ({
        kanjis: [response.data, ...state.kanjis],
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể thêm Kanji",
        loading: false,
      });
      throw err;
    }
  },

  updateKanji: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.put(`/api/kanjis/${id}/`, data);
      set((state) => ({
        kanjis: state.kanjis.map((k) => (k.id === id ? response.data : k)),
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật Kanji",
        loading: false,
      });
      throw err;
    }
  },

  deleteKanji: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/kanjis/${id}/`);
      set((state) => ({
        kanjis: state.kanjis.filter((k) => k.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa Kanji",
        loading: false,
      });
      throw err;
    }
  },

  getKanjiDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/kanjis/${id}/`);
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

  clearError: () => set({ error: null }),
  resetCurrent: () => set({ currentKanji: null }),
}));
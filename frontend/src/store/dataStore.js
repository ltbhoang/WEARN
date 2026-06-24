import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useDataStore = create((set, get) => ({
  // ========== STATE ==========
  collections: [],
  // Cache vocabularies theo collectionId: { [collectionId]: vocabArray }
  vocabulariesByCollection: {},
  // Cache vocabularies theo topic: { [topic]: vocabArray }
  vocabulariesByTopic: {},
  streakData: null,
  // Thời điểm fetch lần cuối
  lastFetched: {
    collections: 0,
    streak: 0,
    topics: {}, // { topic: timestamp }
  },
  loadingStates: {
    collections: false,
    detail: {}, // { collectionId: boolean }
    topics: {}, // { topic: boolean }
    streak: false,
  },
  error: null,

  // ========== ACTIONS ==========
  // --- Collections ---
  fetchCollections: async (force = false) => {
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000;
    if (
      !force &&
      get().collections.length > 0 &&
      now - get().lastFetched.collections < CACHE_TTL
    ) {
      console.log("🟢 Dùng cache collections");
      return;
    }
    set((state) => ({
      loadingStates: { ...state.loadingStates, collections: true },
      error: null,
    }));
    try {
      const response = await axiosPrivate.get("/api/collections/");
      const data = response.data;
      // Lấy mảng từ data.results hoặc fallback data
      const collections = data.results || (Array.isArray(data) ? data : []);
      set({
        collections: collections,
        lastFetched: { ...get().lastFetched, collections: now },
        loadingStates: { ...get().loadingStates, collections: false },
      });
    } catch (err) {
      set({
        error: "Không thể lấy danh sách bộ sưu tập",
        loadingStates: { ...get().loadingStates, collections: false },
      });
    }
  },

  fetchCollectionDetail: async (id, force = false) => {
    const cached = get().vocabulariesByCollection[id];
    if (!force && cached) {
      console.log(`🟢 Dùng cache cho collection ${id}`);
      return { vocabularies: cached };
    }
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        detail: { ...state.loadingStates.detail, [id]: true },
      },
      error: null,
    }));
    try {
      const response = await axiosPrivate.get(`/api/collections/${id}/`);
      const vocabularies = response.data.vocabularies || [];
      set((state) => ({
        vocabulariesByCollection: {
          ...state.vocabulariesByCollection,
          [id]: vocabularies,
        },
        loadingStates: {
          ...state.loadingStates,
          detail: { ...state.loadingStates.detail, [id]: false },
        },
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.message,
        loadingStates: {
          ...get().loadingStates,
          detail: { ...get().loadingStates.detail, [id]: false },
        },
      });
    }
  },

  getVocabulariesByCollection: (id) => get().vocabulariesByCollection[id] || [],

  // --- Vocabulary theo topic (dùng trong CreateFlashcardSetPage) ---
  fetchVocabulariesByTopic: async (topic, force = false) => {
    const now = Date.now();
    const CACHE_TTL = 10 * 60 * 1000; // 10 phút
    const cachedData = get().vocabulariesByTopic[topic];
    const lastFetch = get().lastFetched.topics[topic] || 0;
    if (!force && cachedData && now - lastFetch < CACHE_TTL) {
      console.log(`🟢 Dùng cache cho topic ${topic}`);
      return cachedData;
    }
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        topics: { ...state.loadingStates.topics, [topic]: true },
      },
      error: null,
    }));
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/?topic=${topic}`
      );
      const data = response.data;
      set((state) => ({
        vocabulariesByTopic: { ...state.vocabulariesByTopic, [topic]: data },
        lastFetched: {
          ...state.lastFetched,
          topics: { ...state.lastFetched.topics, [topic]: now },
        },
        loadingStates: {
          ...state.loadingStates,
          topics: { ...state.loadingStates.topics, [topic]: false },
        },
      }));
      return data;
    } catch (err) {
      set({
        error: err.message,
        loadingStates: {
          ...get().loadingStates,
          topics: { ...get().loadingStates.topics, [topic]: false },
        },
      });
      return [];
    }
  },

  getVocabulariesByTopic: (topic) => get().vocabulariesByTopic[topic] || [],

  // --- Thêm từ vào cache (cả collection và topic) ---
  addVocabulary: async (vocabData) => {
    try {
      const response = await axiosPrivate.post("/api/vocabularies/", vocabData);
      const newVocab = response.data;
      const collectionId = vocabData.collection;
      // Cập nhật cache theo collection
      const currentCollectionVocabs =
        get().vocabulariesByCollection[collectionId] || [];
      set({
        vocabulariesByCollection: {
          ...get().vocabulariesByCollection,
          [collectionId]: [...currentCollectionVocabs, newVocab],
        },
      });
      // Nếu từ này có topic, cập nhật cache theo topic
      const topic = newVocab.topic;
      if (topic) {
        const currentTopicVocabs = get().vocabulariesByTopic[topic] || [];
        set({
          vocabulariesByTopic: {
            ...get().vocabulariesByTopic,
            [topic]: [...currentTopicVocabs, newVocab],
          },
        });
      }
      get().refreshStreakIfNeeded();
      return newVocab;
    } catch (err) {
      console.error("Lỗi thêm từ vựng:", err);
      throw err;
    }
  },

  // --- Các action khác giữ nguyên (streak, remove, reset) ---
  fetchStreak: async (force = false) => {
    const now = Date.now();
    const CACHE_TTL = 60 * 1000;
    if (
      !force &&
      get().streakData &&
      now - get().lastFetched.streak < CACHE_TTL
    ) {
      console.log("🟢 Dùng cache streak");
      return get().streakData;
    }
    set((state) => ({
      loadingStates: { ...state.loadingStates, streak: true },
      error: null,
    }));
    try {
      const response = await axiosPrivate.get("/api/streak/");
      set({
        streakData: response.data,
        lastFetched: { ...get().lastFetched, streak: now },
        loadingStates: { ...get().loadingStates, streak: false },
      });
      return response.data;
    } catch (err) {
      console.error("Lỗi lấy thông tin streak:", err);
      set({ loadingStates: { ...get().loadingStates, streak: false } });
      throw err;
    }
  },

  refreshStreakIfNeeded: async () => {
    const now = Date.now();
    if (get().streakData && now - get().lastFetched.streak > 30 * 1000) {
      await get().fetchStreak(true);
    }
  },

  removeItem: async (type, id) => {
    try {
      await axiosPrivate.delete(`/api/${type}/${id}/`);
      if (type === "collections") {
        set((state) => ({
          collections: state.collections.filter((item) => item.id !== id),
          vocabulariesByCollection: (() => {
            const newCache = { ...state.vocabulariesByCollection };
            delete newCache[id];
            return newCache;
          })(),
        }));
      } else if (type === "vocabularies") {
        // Xóa từ khỏi cache (cần tìm topic/collection chứa nó)
        // Đơn giản là clear cache theo topic? Có thể fetch lại collection detail sau.
        console.warn("Xóa từ vựng, cần đồng bộ cache thủ công");
        get().refreshStreakIfNeeded();
      }
    } catch (err) {
      console.error(`Lỗi xóa ${type}:`, err);
    }
  },

  resetCache: () => {
    set({
      collections: [],
      vocabulariesByCollection: {},
      vocabulariesByTopic: {},
      streakData: null,
      lastFetched: { collections: 0, streak: 0, topics: {} },
      loadingStates: {
        collections: false,
        detail: {},
        topics: {},
        streak: false,
      },
      error: null,
    });
  },
}));

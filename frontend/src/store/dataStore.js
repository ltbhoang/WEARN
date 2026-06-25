import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useDataStore = create((set, get) => ({
  // ========== STATE ==========
  collections: [],
  // Cache vocabularies theo collectionId: { [collectionId]: vocabArray } (giữ lại để tương thích)
  vocabulariesByCollection: {},
  // Cache chi tiết collection: { [collectionId]: fullData }
  // (bao gồm saved_vocabularies với user_image, vocab_count, v.v.)
  collectionDetails: {},
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
    const CACHE_TTL = 5 * 60 * 1000; // 5 phút
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
        collections: [],
      });
    }
  },

  // --- Collection Detail (lấy full detail, bao gồm saved_vocabularies) ---
  fetchCollectionDetail: async (id, force = false) => {
    const cached = get().collectionDetails[id];
    if (!force && cached) {
      console.log(`🟢 Dùng cache detail cho collection ${id}`);
      return cached;
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
      const data = response.data;
      // API trả về vocabularies, không phải saved_vocabularies
      const vocabularies = data.vocabularies || data.saved_vocabularies || [];

      set((state) => ({
        collectionDetails: {
          ...state.collectionDetails,
          [id]: data, // data chứa vocabularies
        },
        vocabulariesByCollection: {
          ...state.vocabulariesByCollection,
          [id]: vocabularies,
        },
        loadingStates: {
          ...state.loadingStates,
          detail: { ...state.loadingStates.detail, [id]: false },
        },
      }));
      return data;
    } catch (err) {
      set({
        error: err.message,
        loadingStates: {
          ...get().loadingStates,
          detail: { ...get().loadingStates.detail, [id]: false },
        },
      });
      return null;
    }
  },
  // --- Helper: lấy danh sách ảnh preview (tối đa limit) từ collection detail ---
  getPreviewImages: (collectionId, limit = 4) => {
    const detail = get().collectionDetails[collectionId];
    if (!detail) return [];
    const savedVocabs = detail.saved_vocabularies || [];
    return savedVocabs
      .map((item) => item.user_image)
      .filter((url) => url) // bỏ null/undefined
      .slice(0, limit);
  },

  // --- Helper: lấy số lượng từ vựng thực tế của collection ---
  getVocabCount: (collectionId) => {
    const detail = get().collectionDetails[collectionId];
    if (!detail) return 0;
    return detail.saved_vocabularies?.length || 0;
  },

  // --- Helper: lấy toàn bộ saved_vocabularies với user_image của collection ---
  getSavedVocabularies: (collectionId) => {
    const detail = get().collectionDetails[collectionId];
    if (!detail) return [];
    return detail.saved_vocabularies || [];
  },

  // --- Lấy danh sách vocabulary (chỉ thông tin từ, không có ảnh) (cũ) ---
  getVocabulariesByCollection: (id) => {
    // Nếu có collectionDetails thì lấy từ đó, ngược lại lấy từ cache cũ
    const detail = get().collectionDetails[id];
    if (detail) {
      return detail.saved_vocabularies?.map((item) => item.vocabulary) || [];
    }
    return get().vocabulariesByCollection[id] || [];
  },

  // --- Vocabulary theo topic ---
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
      const list = data.results || (Array.isArray(data) ? data : []);
      set((state) => ({
        vocabulariesByTopic: { ...state.vocabulariesByTopic, [topic]: list },
        lastFetched: {
          ...state.lastFetched,
          topics: { ...state.lastFetched.topics, [topic]: now },
        },
        loadingStates: {
          ...state.loadingStates,
          topics: { ...state.loadingStates.topics, [topic]: false },
        },
      }));
      return list;
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
      // Cập nhật cache theo collection (nếu có)
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
      // Refresh streak nếu cần
      get().refreshStreakIfNeeded();
      return newVocab;
    } catch (err) {
      console.error("Lỗi thêm từ vựng:", err);
      throw err;
    }
  },

  // --- Streak ---
  fetchStreak: async (force = false) => {
    const now = Date.now();
    const CACHE_TTL = 60 * 1000; // 1 phút
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

  // --- Xóa item ---
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
          collectionDetails: (() => {
            const newDetails = { ...state.collectionDetails };
            delete newDetails[id];
            return newDetails;
          })(),
        }));
      } else if (type === "vocabularies") {
        // Xóa từ vựng khỏi cache (có thể fetch lại collection detail sau)
        console.warn("Xóa từ vựng, cần đồng bộ cache thủ công");
        get().refreshStreakIfNeeded();
      }
    } catch (err) {
      console.error(`Lỗi xóa ${type}:`, err);
    }
  },

  // --- Reset cache ---
  resetCache: () => {
    set({
      collections: [],
      vocabulariesByCollection: {},
      collectionDetails: {},
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

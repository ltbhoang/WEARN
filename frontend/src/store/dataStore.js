import { create } from 'zustand';
import { axiosPrivate } from '../apis/axios';

export const useDataStore = create((set, get) => ({
    // --- STATE ---
    collections: [],
    vocabularies: [],
    loading: false,
    error: null,

    // State cho Streak và Thành tựu
    streakData: {
        current_streak: 0,
        longest_streak: 0,
        total_vocab_learned: 0,
        stats: {
            total_learned: 0,
            percent_complete: 0,
            memorized: 0,
            need_review: 0
        },
        activity_dates: [],
        achievements: []
    },

    // --- ACTIONS CHO COLLECTIONS ---

    fetchCollections: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axiosPrivate.get('/api/collections/');
            set({ collections: response.data, loading: false });
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            set({ error: "Không thể lấy danh sách bộ sưu tập", loading: false });
        }
    },

    fetchCollectionDetail: async (id) => {
        set({ loading: true });
        try {
            const response = await axiosPrivate.get(`/api/collections/${id}/`);
            set({ vocabularies: response.data.vocabularies || [], loading: false });
            return response.data;
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    addCollection: async (collectionData) => {
        try {
            const response = await axiosPrivate.post('/api/collections/', collectionData);
            set((state) => ({
                collections: [...state.collections, response.data]
            }));
            return response.data;
        } catch (err) {
            console.error("Lỗi tạo collection:", err);
        }
    },

    // --- ACTIONS CHO VOCABULARIES ---

    fetchVocabularies: async (collectionId = null) => {
        set({ loading: true });
        try {
            const url = collectionId 
                ? `/api/vocabularies/?collection=${collectionId}` 
                : '/api/vocabularies/';
            const response = await axiosPrivate.get(url);
            set({ vocabularies: response.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    addVocabulary: async (vocabData) => {
        try {
            const response = await axiosPrivate.post('/api/vocabularies/', vocabData);
            set((state) => ({
                vocabularies: [...state.vocabularies, response.data]
            }));
            
            // QUAN TRỌNG: Mỗi khi thêm từ mới, gọi lại fetchStreak để nhảy số ngay lập tức
            get().fetchStreak();
            
            return response.data;
        } catch (err) {
            console.error("Lỗi thêm từ vựng:", err);
        }
    },

    // --- ACTIONS CHO STREAK & ACHIEVEMENTS ---

    fetchStreak: async () => {
        // Chỉ set loading nếu chưa có dữ liệu (để tránh nháy màn hình khi update ngầm)
        if (!get().streakData.activity_dates.length) set({ loading: true });
        
        try {
            const response = await axiosPrivate.get('/api/streak/');
            set({ streakData: response.data, loading: false });
        } catch (err) {
            console.error("Lỗi lấy thông tin streak:", err);
            set({ loading: false });
        }
    },

    // --- CÁC ACTIONS KHÁC ---

    removeItem: async (type, id) => {
        try {
            await axiosPrivate.delete(`/api/${type}/${id}/`);
            if (type === 'collections') {
                set((state) => ({
                    collections: state.collections.filter(item => item.id !== id)
                }));
            } else {
                set((state) => ({
                    vocabularies: state.vocabularies.filter(item => item.id !== id)
                }));
                // Cập nhật lại streak/stats sau khi xóa từ
                get().fetchStreak();
            }
        } catch (err) {
            console.error(`Lỗi xóa ${type}:`, err);
        }
    }
}));
import { create } from "zustand";
import { axiosPrivate } from "../apis/axios";

export const useFlashcardStore = create((set, get) => ({
  // --- STATE ---
  flashcardSets: [],
  currentSet: null,
  reviewItems: [],
  savedVocabularies: [], // Danh sách SavedVocabulary của user
  dueVocabularies: [], // Danh sách từ vựng cần ôn theo SM-2
  reviewResult: null, // Kết quả trả về sau khi submit
  loading: false,
  error: null,

  // --- ACTIONS CHO FLASHCARD SETS ---

  fetchFlashcardSets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/flashcard-sets/");
      set({ flashcardSets: response.data, loading: false });
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể lấy danh sách bộ flashcard",
        loading: false,
      });
    }
  },

  fetchFlashcardSetDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(`/api/flashcard-sets/${id}/`);
      set({ currentSet: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể lấy chi tiết bộ flashcard",
        loading: false,
      });
    }
  },

  createFlashcardSet: async (setData) => {
    // setData = { name, description, items: [{ type: 'camera', id }, { type: 'system', id }] }
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/flashcard-sets/", setData);
      set((state) => ({
        flashcardSets: [response.data, ...state.flashcardSets],
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể tạo bộ flashcard",
        loading: false,
      });
      throw err;
    }
  },

  updateFlashcardSet: async (id, setData) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.patch(
        `/api/flashcard-sets/${id}/`,
        setData
      );
      set((state) => ({
        flashcardSets: state.flashcardSets.map((set) =>
          set.id === id ? response.data : set
        ),
        currentSet:
          state.currentSet?.id === id ? response.data : state.currentSet,
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể cập nhật bộ flashcard",
        loading: false,
      });
    }
  },

  deleteFlashcardSet: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosPrivate.delete(`/api/flashcard-sets/${id}/`);
      set((state) => ({
        flashcardSets: state.flashcardSets.filter((set) => set.id !== id),
        currentSet: state.currentSet?.id === id ? null : state.currentSet,
        loading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể xóa bộ flashcard",
        loading: false,
      });
    }
  },

  // --- ACTIONS CHO SAVED VOCABULARIES ---
  fetchSavedVocabularies: async () => {
    set({ loading: true, error: null });
    try {
      // Endpoint này cần được tạo trong Django: trả về danh sách SavedVocabulary của user
      const response = await axiosPrivate.get("/api/saved-vocabularies/");
      console.log("API /saved-vocabularies trả về:", response.data);
      set({ savedVocabularies: response.data, loading: false });
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể lấy danh sách từ đã lưu",
        loading: false,
      });
    }
  },

  // --- ACTIONS CHO FLASHCARD ITEMS ---

  fetchReviewItems: async (setId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get(
        `/api/flashcard-sets/${setId}/review/`
      );
      set({ reviewItems: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể lấy danh sách ôn tập",
        loading: false,
      });
    }
  },

  addVocabularyToSet: async (setId, item) => {
    // item = { type: 'camera', id: savedVocabId } hoặc { type: 'system', id: vocabularyId }
    try {
      const response = await axiosPrivate.post(
        `/api/flashcard-sets/${setId}/add_vocab/`,
        item
      );
      // Cập nhật currentSet tương tự như cũ
      set((state) => {
        if (state.currentSet?.id === setId) {
          const newItems = [...(state.currentSet.items || []), response.data];
          return {
            currentSet: {
              ...state.currentSet,
              items: newItems,
              item_count: (state.currentSet.item_count || 0) + 1,
            },
          };
        }
        return state;
      });
      return response.data;
    } catch (err) {
      console.error("Lỗi thêm từ vào bộ:", err);
      throw err;
    }
  },

  removeVocabularyFromSet: async (setId, itemId) => {
    try {
      await axiosPrivate.post(`/api/flashcard-sets/${setId}/remove_vocab/`, {
        item_id: itemId,
      });

      set((state) => {
        // Cập nhật currentSet
        if (state.currentSet?.id === setId) {
          const itemToRemove = state.currentSet.items?.find(
            (item) => item.id === itemId
          );
          const wasMemorized = itemToRemove?.memorized || false;
          const newItems = state.currentSet.items.filter(
            (item) => item.id !== itemId
          );
          return {
            currentSet: {
              ...state.currentSet,
              items: newItems,
              item_count: (state.currentSet.item_count || 0) - 1,
              memorized_count: wasMemorized
                ? (state.currentSet.memorized_count || 0) - 1
                : state.currentSet.memorized_count || 0,
            },
          };
        }
        return state;
      });

      // Xóa khỏi reviewItems nếu có
      set((state) => ({
        reviewItems: state.reviewItems.filter((item) => item.id !== itemId),
      }));
    } catch (err) {
      console.error("Lỗi xóa từ khỏi bộ:", err);
      throw err;
    }
  },

  updateItemMemorized: async (itemId, memorized) => {
    try {
      const response = await axiosPrivate.patch(
        `/api/flashcard-items/${itemId}/`,
        {
          memorized,
        }
      );

      set((state) => {
        // Cập nhật currentSet
        let newCurrentSet = state.currentSet;
        if (state.currentSet) {
          const items = state.currentSet.items || [];
          const itemIndex = items.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            const oldMemorized = items[itemIndex].memorized;
            const newItems = [...items];
            newItems[itemIndex] = { ...newItems[itemIndex], memorized };

            // Tính lại memorized_count
            let delta = 0;
            if (memorized && !oldMemorized) delta = 1;
            else if (!memorized && oldMemorized) delta = -1;

            newCurrentSet = {
              ...state.currentSet,
              items: newItems,
              memorized_count: (state.currentSet.memorized_count || 0) + delta,
            };
          }
        }

        // Cập nhật reviewItems: nếu memorized = true thì xóa khỏi danh sách ôn tập
        let newReviewItems = state.reviewItems;
        if (memorized) {
          newReviewItems = state.reviewItems.filter(
            (item) => item.id !== itemId
          );
        }

        return {
          currentSet: newCurrentSet,
          reviewItems: newReviewItems,
        };
      });

      return response.data;
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      throw err;
    }
  },

  // Lấy danh sách từ vựng cần ôn hôm nay (theo SM-2)
  fetchDueVocabularies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.get("/api/due-vocabularies/");
      set({ dueVocabularies: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({
        error:
          err.response?.data?.message || "Không thể lấy danh sách từ cần ôn",
        loading: false,
      });
    }
  },

  // Gửi kết quả ôn tập (grade) cho một từ vựng
  submitReview: async (vocabularyId, grade) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosPrivate.post("/api/submit-review/", {
        vocabulary_id: vocabularyId,
        grade: grade,
      });
      set({ reviewResult: response.data, loading: false });
      // Sau khi submit thành công, loại bỏ từ vừa ôn khỏi danh sách dueVocabularies
      set((state) => ({
        dueVocabularies: state.dueVocabularies.filter(
          (item) => item.vocabulary_id !== vocabularyId
        ),
      }));
      return response.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Không thể gửi kết quả ôn tập",
        loading: false,
      });
      throw err;
    }
  },

  bulkUpdateMemorized: async (items) => {
    try {
      const response = await axiosPrivate.post(
        "/api/flashcard-items/bulk_update_memorized/",
        {
          items,
        }
      );

      // Sau khi cập nhật hàng loạt, làm mới dữ liệu từ API để đảm bảo đồng bộ
      if (get().reviewItems.length > 0) {
        const setId = get().currentSet?.id;
        if (setId) {
          await get().fetchReviewItems(setId);
        }
      } else if (get().currentSet) {
        const setId = get().currentSet.id;
        await get().fetchFlashcardSetDetail(setId);
      }

      return response.data;
    } catch (err) {
      console.error("Lỗi cập nhật hàng loạt:", err);
      throw err;
    }
  },

  reorderItems: async (setId, orderData) => {
    try {
      await axiosPrivate.post(`/api/flashcard-sets/${setId}/reorder/`, {
        order: orderData,
      });

      // Refresh lại currentSet để lấy thứ tự mới
      if (get().currentSet?.id === setId) {
        await get().fetchFlashcardSetDetail(setId);
      }
    } catch (err) {
      console.error("Lỗi sắp xếp lại thứ tự:", err);
      throw err;
    }
  },

  getUnmemorizedVocabularies: () => {
    const { flashcardSets } = get();
    const unmemorizedItems = [];
    // Sắp xếp bộ theo thời gian tạo cũ nhất lên trước
    const sortedSets = [...flashcardSets].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    for (const set of sortedSets) {
      for (const item of set.items) {
        if (!item.memorized && item.vocabulary_detail) {
          unmemorizedItems.push({
            itemId: item.id,
            flashcardSetId: set.id,
            flashcardSetName: set.name,
            vocabularyId: item.vocabulary,
            word: item.vocabulary_detail.word,
            meaning: item.vocabulary_detail.meaning,
            readingHiragana: item.vocabulary_detail.reading_hiragana,
            pronunciation: item.vocabulary_detail.pronunciation,
            exampleSentence: item.vocabulary_detail.example_sentence,
            exampleTranslation: item.vocabulary_detail.example_translation,
            audioUrl: item.vocabulary_detail.audio_url,
            userImage: item.user_image,
          });
        }
      }
    }
    return unmemorizedItems;
  },

  // Lấy danh sách từ chưa thuộc theo một bộ flashcard cụ thể
  getUnmemorizedVocabulariesBySetId: (setId) => {
    const { flashcardSets } = get();
    const targetSet = flashcardSets.find((set) => set.id === setId);
    if (!targetSet) return [];
    const unmemorizedItems = [];
    for (const item of targetSet.items) {
      if (!item.memorized && item.vocabulary_detail) {
        unmemorizedItems.push({
          itemId: item.id,
          flashcardSetId: targetSet.id,
          flashcardSetName: targetSet.name,
          vocabularyId: item.vocabulary,
          word: item.vocabulary_detail.word,
          meaning: item.vocabulary_detail.meaning,
          readingHiragana: item.vocabulary_detail.reading_hiragana,
          pronunciation: item.vocabulary_detail.pronunciation,
          exampleSentence: item.vocabulary_detail.example_sentence,
          exampleTranslation: item.vocabulary_detail.example_translation,
          audioUrl: item.vocabulary_detail.audio_url,
          userImage: item.user_image,
        });
      }
    }
    return unmemorizedItems;
  },

  // --- HELPER FUNCTIONS ---

  resetCurrentSet: () => {
    set({ currentSet: null, reviewItems: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));

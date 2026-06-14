// hooks/useSM2.js (hoặc services/sm2.js)
import { useCallback, useState } from 'react';

// ==================== Phần Service thuần (không React) ====================
export const SM2_CONSTANTS = {
  DEFAULT_EF: 2.5,
  MIN_EF: 1.3,
  INITIAL_INTERVAL_1: 1,
  INITIAL_INTERVAL_2: 6,
  QUALITY_THRESHOLD_RESET: 3,
};

export function calculateSM2(quality, current = { ef: SM2_CONSTANTS.DEFAULT_EF, interval: 0, repetitions: 0 }) {
  let { ef, interval, repetitions } = current;
  
  if (quality < SM2_CONSTANTS.QUALITY_THRESHOLD_RESET) {
    repetitions = 0;
    interval = SM2_CONSTANTS.INITIAL_INTERVAL_1;
  } else {
    if (repetitions === 0) {
      interval = SM2_CONSTANTS.INITIAL_INTERVAL_1;
    } else if (repetitions === 1) {
      interval = SM2_CONSTANTS.INITIAL_INTERVAL_2;
    } else {
      interval = Math.round(interval * ef);
    }
    repetitions++;
  }

  // Cập nhật EF (công thức gốc SM-2)
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < SM2_CONSTANTS.MIN_EF) ef = SM2_CONSTANTS.MIN_EF;

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ef, interval, repetitions, nextReviewDate };
}

/**
 * Lưu / cập nhật dữ liệu SM-2 qua storage adapter (localStorage, API, ...)
 * @param {string} wordId
 * @param {number} quality
 * @param {object} storageAdapter - { get, set }
 */
export async function updateSM2ForWord(wordId, quality, storageAdapter) {
  const current = await storageAdapter.get(wordId) || {
    ef: SM2_CONSTANTS.DEFAULT_EF,
    interval: 0,
    repetitions: 0,
  };
  const updated = calculateSM2(quality, current);
  await storageAdapter.set(wordId, updated);
  return updated;
}

// ==================== Adapter mặc định (localStorage) ====================
const localStorageAdapter = {
  get: (key) => {
    const data = localStorage.getItem(`sm2_${key}`);
    return data ? JSON.parse(data) : null;
  },
  set: (key, value) => {
    localStorage.setItem(`sm2_${key}`, JSON.stringify(value));
  },
};

// ==================== React Hook ====================
export function useSM2(storageAdapter = localStorageAdapter) {
  const [sm2Data, setSm2Data] = useState({});

  const updateWord = useCallback(async (wordId, quality) => {
    const updated = await updateSM2ForWord(wordId, quality, storageAdapter);
    setSm2Data(prev => ({ ...prev, [wordId]: updated }));
    return updated;
  }, [storageAdapter]);

  const getWordData = useCallback((wordId) => {
    return sm2Data[wordId] || null;
  }, [sm2Data]);

  return { updateWord, getWordData, sm2Data };
}
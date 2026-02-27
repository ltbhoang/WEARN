import { create } from 'zustand';
import Cookies from 'js-cookie';
// eslint-disable-next-line no-unused-vars
import { axiosPublic, axiosPrivate } from '../apis/axios';

const syncCookies = (state) => {
    const { accessToken, refreshToken, user } = state;
    const options = { expires: 7 }; // Lưu 7 ngày cho máu

    if (accessToken) Cookies.set('accessToken', accessToken, options);
    else Cookies.remove('accessToken');

    if (refreshToken) Cookies.set('refreshToken', refreshToken, options);
    else Cookies.remove('refreshToken');

    if (user) Cookies.set('user', JSON.stringify(user), options);
    else Cookies.remove('user');
};

export const useAuthStore = create((set, get) => ({
    // --- STATE ---
    accessToken: Cookies.get('accessToken') || null,
    refreshToken: Cookies.get('refreshToken') || null,
    user: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null,
    loading: false,

    // --- ACTIONS ---
    
    // 1. Gọi API Đăng nhập
    login: async (username, password) => {
        set({ loading: true });
        try {
            const response = await axiosPublic.post('/api/login/', { username, password });
            const { access, refresh } = response.data;
            
            // Giả sử Django trả về user đơn giản, hoặc má gọi thêm API profile
            const userData = { username }; 

            set({ accessToken: access, refreshToken: refresh, user: userData });
            syncCookies(get());
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data };
        } finally {
            set({ loading: false });
        }
    },

    // 2. Logic Refresh Token (Sẽ được Axios Interceptor gọi)
    refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) return null;

        try {
            const response = await axiosPublic.post('/api/login/refresh/', {
                refresh: currentRefreshToken,
            });
            const { access } = response.data;
            
            set({ accessToken: access });
            syncCookies(get());
            return access;
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            get().logout(); // Refresh hỏng thì đá ra ngoài luôn
            return null;
        }
    },

    logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        syncCookies(get());
    },

    updateUser: (updates) => {
        set((state) => ({
            user: { ...state.user, ...updates }
        }));
        syncCookies(get());
    }
}));
import { create } from 'zustand';
import Cookies from 'js-cookie';
import { axiosPublic, axiosPrivate } from '../apis/axios';

const syncCookies = (state) => {
    const { accessToken, refreshToken, user } = state;
    const options = { expires: 7 };

    if (accessToken) Cookies.set('accessToken', accessToken, options);
    else Cookies.remove('accessToken');

    if (refreshToken) Cookies.set('refreshToken', refreshToken, options);
    else Cookies.remove('refreshToken');

    if (user) Cookies.set('user', JSON.stringify(user), options);
    else Cookies.remove('user');
};

export const useAuthStore = create((set, get) => ({
    accessToken: Cookies.get('accessToken') || null,
    refreshToken: Cookies.get('refreshToken') || null,
    user: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null,
    loading: false,

    fetchUserProfile: async () => {
        try {
            const response = await axiosPrivate.get('/api/user-profile/');
            const userData = response.data;
            set({ user: userData });
            syncCookies(get());
            return userData;
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            // Nếu lỗi 401, có thể token hết hạn, logout
            if (error.response?.status === 401) {
                get().logout();
            }
            throw error;
        }
    },

    login: async (username, password) => {
        set({ loading: true });
        try {
            const response = await axiosPublic.post('/api/login/', { username, password });
            const { access, refresh } = response.data;
            set({ accessToken: access, refreshToken: refresh });
            syncCookies(get());

            // Gọi lấy profile user sau khi có token
            const userProfile = await get().fetchUserProfile();
            return { success: true, user: userProfile };
        } catch (error) {
            return { success: false, error: error.response?.data };
        } finally {
            set({ loading: false });
        }
    },

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
        } catch (error) {
            get().logout();
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
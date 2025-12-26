import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  read_at: Date | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: Date;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: string;
  priority?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filters: {
    is_read: false,
  },
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setNotifications: (
      state,
      action: PayloadAction<{ notifications: Notification[]; unreadCount: number }>
    ) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      state.loading = false;
      state.error = null;
    },

    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find((n) => n.notification_id === action.payload);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        notification.read_at = new Date();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        if (!n.is_read) {
          n.is_read = true;
          n.read_at = new Date();
        }
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find((n) => n.notification_id === action.payload);
      if (notification && !notification.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n.notification_id !== action.payload);
    },

    setFilters: (state, action: PayloadAction<Partial<NotificationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = { is_read: false };
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setLoading,
  setError,
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setFilters,
  clearFilters,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

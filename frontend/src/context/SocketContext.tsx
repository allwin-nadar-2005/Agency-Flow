import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog, Notification } from '../types';
import api from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserCount: number;
  realtimeActivities: ActivityLog[];
  unreadNotificationCount: number;
  notifications: Notification[];
  fetchCatchupEvents: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState<number>(0);
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Fetch initial notifications and catchup activities
  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const [actRes, notifRes, unreadRes] = await Promise.all([
        api.get('/activity/catchup?limit=20'),
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);

      setRealtimeActivities(actRes.data.data);
      setNotifications(notifRes.data.data);
      setUnreadNotificationCount(unreadRes.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to load initial socket data:', err);
    }
  };

  useEffect(() => {
    if (!user || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    fetchInitialData();

    // Connect Socket.IO client
    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    const newSocket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Automatically catchup last 20 missed events on reconnect
      fetchInitialData();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for Real-Time Activity Events
    newSocket.on('activity:created', (newActivity: ActivityLog) => {
      setRealtimeActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
    });

    // Listen for Real-Time Notification Events
    newSocket.on('notification:new', (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
    });

    // Listen for Presence Updates (Admin online user count)
    newSocket.on('presence:update', (data: { onlineUserCount: number }) => {
      setOnlineUserCount(data.onlineUserCount);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, accessToken]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserCount,
        realtimeActivities,
        unreadNotificationCount,
        notifications,
        fetchCatchupEvents: fetchInitialData,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

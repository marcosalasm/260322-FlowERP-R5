import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: number;
  message: string;
  read: boolean;
  date: string; // ISO string
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (message: string) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string) => {
    const newNotification: AppNotification = {
      id: Date.now(),
      message,
      read: false,
      date: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);
  
  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  }, []);

  // ── Supabase Realtime: Listen for new automatically-created prospects ──
  useEffect(() => {
    const channel = supabase
      .channel('prospect-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prospects' },
        (payload: any) => {
          const newProspect = payload.new;
          // Only notify if the prospect was created from an automated flow
          if (newProspect?.source && newProspect.source !== 'Manual') {
            const message = `🔔 Nuevo Prospecto "${newProspect.name}" creado automáticamente. Origen: ${newProspect.source}.`;
            const notification: AppNotification = {
              id: Date.now() + Math.random(),
              message,
              read: false,
              date: new Date().toISOString(),
            };
            setNotifications(prev => {
              // Avoid duplicate notifications (same prospect name within 5 seconds)
              const recentDupe = prev.some(n =>
                n.message.includes(newProspect.name) &&
                Date.now() - new Date(n.date).getTime() < 5000
              );
              if (recentDupe) return prev;
              return [notification, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

interface PushNotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: null;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<null>;
  unsubscribe: () => Promise<boolean>;
  sendNotification: (payload: NotificationPayload) => Promise<boolean>;
}

interface PushNotificationProviderProps {
  children: ReactNode;
}

const PushNotificationContext = createContext<PushNotificationContextType | null>(null);

export const usePushNotification = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider');
  }
  return context;
};

// This is a dummy provider that doesn't use service workers
const PushNotificationProvider = ({ children }: PushNotificationProviderProps) => {
  // All methods are stubs that don't use service workers
  const requestPermission = async (): Promise<boolean> => {
    console.log('Push notifications are disabled');
    return false;
  };

  const subscribe = async (): Promise<null> => {
    console.log('Push notifications are disabled');
    return null;
  };

  const unsubscribe = async (): Promise<boolean> => {
    console.log('Push notifications are disabled');
    return true;
  };

  const sendNotification = async (): Promise<boolean> => {
    console.log('Push notifications are disabled');
    return false;
  };

  const value = {
    isSupported: false,
    permission: 'denied' as NotificationPermission,
    subscription: null,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export default PushNotificationProvider;

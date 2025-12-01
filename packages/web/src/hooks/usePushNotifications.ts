'use client';

import { useEffect, useState, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
  isSubscribed: boolean;
}

// Replace with your VAPID public key
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    subscription: null,
    isSubscribed: false,
  });

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window;

    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : null,
    }));

    if (!isSupported) return;

    // Check existing subscription
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState(prev => ({
          ...prev,
          subscription,
          isSubscribed: !!subscription,
        }));
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, []);

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      console.error('[Push] Push notifications not supported');
      return null;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        console.log('[Push] Permission denied');
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
      });

      console.log('[Push] Subscribed:', subscription);

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true,
      }));

      // Send subscription to server
      await sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      return null;
    }
  }, [state.isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    try {
      await state.subscription.unsubscribe();

      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false,
      }));

      // Remove subscription from server
      await removeSubscriptionFromServer(state.subscription);

      console.log('[Push] Unsubscribed');
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
    }
  }, [state.subscription]);

  // Show a local notification (for testing)
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.error('[Push] Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        ...options,
      });
    } catch (error) {
      console.error('[Push] Error showing notification:', error);
    }
  }, [state.permission]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// Helper function to send subscription to server
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
  } catch (error) {
    console.error('[Push] Error sending subscription to server:', error);
  }
}

// Helper function to remove subscription from server
async function removeSubscriptionFromServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }
  } catch (error) {
    console.error('[Push] Error removing subscription from server:', error);
  }
}

export default usePushNotifications;

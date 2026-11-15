import { useCallback } from "react";

const hasNotification = () => typeof window !== "undefined" && "Notification" in window;

export function usePushNotifications() {
  const requestPermission = useCallback(async () => {
    if (!hasNotification()) return "unsupported";
    if (window.Notification.permission === "granted") return "granted";
    if (window.Notification.permission === "denied") return "denied";
    const result = await window.Notification.requestPermission();
    return result;
  }, []);

  const showNotification = useCallback((titulo, opciones = {}) => {
    if (!hasNotification() || window.Notification.permission !== "granted") return;
    new window.Notification(titulo, {
      icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172515293447819f485fc/28e5a7606_LogoApp.jpg",
      badge: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172515293447819f485fc/28e5a7606_LogoApp.jpg",
      ...opciones,
    });
  }, []);

  const permission = hasNotification() ? window.Notification.permission : "unsupported";

  return { requestPermission, showNotification, permission };
}
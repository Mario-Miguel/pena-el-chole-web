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
      icon: "/logo.jpg",
      badge: "/logo.jpg",
      ...opciones,
    });
  }, []);

  const permission = hasNotification() ? window.Notification.permission : "unsupported";

  return { requestPermission, showNotification, permission };
}
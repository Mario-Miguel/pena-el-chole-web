import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "./usePushNotifications";

export default function NotifPushBanner() {
  const { requestPermission, permission } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ya = localStorage.getItem("push_notif_dismissed");
    if (ya) { setDismissed(true); return; }
    if (permission === "default") setVisible(true);
  }, [permission]);

  const handleActivar = async () => {
    await requestPermission();
    setVisible(false);
    localStorage.setItem("push_notif_dismissed", "1");
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("push_notif_dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-xl border border-[#630027]/20 p-4 max-w-xs w-[calc(100vw-2rem)] sm:w-80">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-[#630027]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-800">¿Activar notificaciones?</p>
          <p className="text-xs text-gray-400 mt-0.5">Recibe alertas de nuevas notificaciones y mensajes del chat</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleActivar} className="flex-1 bg-[#630027] text-white text-xs font-semibold rounded-xl py-1.5 hover:bg-[#4a001d] transition-colors">
              Activar
            </button>
            <button onClick={handleDismiss} className="flex-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl py-1.5 hover:bg-gray-200 transition-colors">
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { getPref } from "@/lib/uiPrefs";

export default function ChatBubble({ mensajesNoLeidos = 0 }) {
  const [bottomNavVisible, setBottomNavVisible] = useState(
    () => localStorage.getItem("pena_bottom_nav_hidden") !== "true"
  );

  useEffect(() => {
    const handler = () => setBottomNavVisible(localStorage.getItem("pena_bottom_nav_hidden") !== "true");
    window.addEventListener("bottomNavVisibilityChanged", handler);
    return () => window.removeEventListener("bottomNavVisibilityChanged", handler);
  }, []);

  // Chat bubble siempre va en la posición base (la más baja)
  const bottom = bottomNavVisible ? 80 : 24;

  return (
    <Link to={createPageUrl("Chat")} style={{ position: "fixed", right: 16, bottom, zIndex: 50 }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-11 h-11 bg-[#630027] rounded-full shadow-lg flex items-center justify-center cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        {mensajesNoLeidos > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
          </span>
        )}
      </motion.div>
    </Link>
  );
}
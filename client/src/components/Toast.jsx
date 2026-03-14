import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Toast({ message, type = "error", onClose, duration = 5000 }) {
  const { dark } = useTheme();

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = { error: "✗", success: "✓", warning: "⚠", info: "ℹ" };

  const colorMap = {
    error:   dark ? "border-red-700 bg-dark-surface text-red-400"     : "border-red-300 bg-light-surface text-red-600",
    success: dark ? "border-green-700 bg-dark-surface text-green-400" : "border-green-300 bg-light-surface text-green-600",
    warning: dark ? "border-yellow-700 bg-dark-surface text-yellow-400" : "border-yellow-300 bg-light-surface text-yellow-600",
    info:    dark ? "border-dark-accent bg-dark-surface text-dark-text" : "border-light-accent bg-light-surface text-light-text",
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border rounded-xl px-4 py-3 shadow-xl animate-slide-in max-w-sm flex items-center gap-3 font-mono text-[11px] tracking-wider ${colorMap[type]}`}>
      <span className="text-base">{icons[type]}</span>
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-2">✕</button>
    </div>
  );
}
import { useState, useRef } from "react";
import { sendMessage } from "../services/chatApi";
import { useTheme } from "../context/ThemeContext";

export default function MessageInput({ convoId, user, socket, onNew, onError }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const { dark } = useTheme();

  const handleSend = async () => {
    if (!text.trim() || !convoId) return;
    const messageText = text.trim();
    if (isTypingRef.current) {
      socket.emit("stopTyping", { conversationId: convoId, userId: user._id });
      isTypingRef.current = false;
    }
    setSending(true);
    setText("");
    try {
      const res = await sendMessage({ conversationId: convoId, text: messageText });
      onNew(res.data);
    } catch (error) {
      setText(messageText);
      if (onError) {
        const msg = error.response?.status === 403 ? "You don't have permission to send messages here"
          : error.response?.status === 404 ? "Conversation not found"
          : error.message === "Network Error" ? "Network error. Check your connection"
          : "Failed to send message. Please try again";
        onError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);
    if (!value.trim()) {
      if (isTypingRef.current) {
        socket.emit("stopTyping", { conversationId: convoId, userId: user._id });
        isTypingRef.current = false;
      }
      return;
    }
    if (!isTypingRef.current) {
      socket.emit("typing", { conversationId: convoId, userId: user._id, username: user.username });
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("stopTyping", { conversationId: convoId, userId: user._id });
        isTypingRef.current = false;
      }
    }, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-t ${dark ? "border-dark-border bg-dark-surface" : "border-light-border bg-light-surface2"}`}>
      <input
        className={`flex-1 font-mono text-sm px-4 py-2.5 rounded-xl border outline-none transition-all ${dark
          ? "bg-light-surface border-dark-border text-blue-900 placeholder:text-dark-muted focus:border-dark-accent"
          : "bg-light-surface border-light-border text-light-text placeholder:text-light-muted focus:border-light-accent"}`}
        value={text}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        placeholder={sending ? "sending..." : "type a message..."}
        disabled={sending}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className={`font-mono text-[11px] tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 ${dark
          ? "bg-dark-text text-dark-bg hover:shadow-[0_4px_16px_#D2C1B644]"
          : "bg-light-accent text-light-bg hover:shadow-[0_4px_16px_#D2535344]"}`}
      >
        {sending ? "..." : "SEND →"}
      </button>
    </div>
  );
}
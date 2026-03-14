import { useEffect, useRef, useState } from "react";
import { formatTimestamp, formatFullTimestamp } from "../utils/formatTimestamp";
import { useTheme } from "../context/ThemeContext";

export default function MessageList({ messages, user, typingUsers = [], onDeleteMessage, onSenderClick }) {
  const bottomRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const { dark } = useTheme();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${dark ? "bg-dark-bg" : "bg-light-bg"}`}>
      {messages.map((m) => {
        const senderId = typeof m.sender === "object" ? m.sender._id : m.sender;
        const senderName = typeof m.sender === "object" ? m.sender.username : null;
        const isMine = String(senderId) === String(user._id);

        return (
          <div
            key={m._id}
            className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            onMouseEnter={() => setHoveredId(m._id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-end gap-2">
              {isMine && hoveredId === m._id && (
                <button
                  onClick={() => setDeleteTargetId(m._id)}
                  className="text-red-400 hover:text-red-300 font-mono text-[12px] mb-1 transition-colors"
                  title="Delete message"
                >Delete</button>
              )}

              {/* Avatar initial — other person only */}
              {!isMine && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 mb-1 ${dark ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>
                  {(senderName || "?")[0].toUpperCase()}
                </div>
              )}

              <div className={`max-w-[75vw] sm:max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl ${isMine
                ? dark ? "bg-dark-accent text-dark-text rounded-br-sm" : "bg-light-accent text-light-bg rounded-br-sm"
                : dark ? "bg-dark-surface text-dark-text rounded-bl-sm" : "bg-light-surface text-light-text rounded-bl-sm"
              }`}>
                {!isMine && senderName && (
                  <div
                    className={`font-mono text-[10px] tracking-wider mb-1 ${onSenderClick ? "cursor-pointer hover:underline" : ""} ${dark ? "text-dark-muted" : "text-light-muted"}`}
                    onClick={() => onSenderClick && onSenderClick(m.sender)}
                  >
                    {senderName}
                  </div>
                )}
                <div className="break-words font-body text-sm leading-relaxed">{m.text}</div>
              </div>
            </div>

            {m.createdAt && (
              <div
                className={`font-mono text-[10px] mt-1 px-1 ${dark ? "text-dark-muted" : "text-light-muted"}`}
                title={formatFullTimestamp(m.createdAt)}
              >
                {formatTimestamp(m.createdAt)}
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className={`flex items-center gap-2 font-mono text-[11px] ${dark ? "text-dark-muted" : "text-light-muted"}`}>
          <div className="flex gap-0.5">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
          </div>
          <span>
            {typingUsers.length === 1
              ? `${typingUsers[0].username} is typing...`
              : typingUsers.length === 2
              ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
              : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Delete confirmation modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className={`rounded-2xl border p-6 w-72 shadow-2xl ${dark ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}>
            <div className={`h-1 w-12 rounded mb-4 ${dark ? "bg-dark-accent" : "bg-light-accent"}`} />
            <h3 className={`font-display text-xl tracking-wide mb-2 ${dark ? "text-dark-text" : "text-light-text"}`}>DELETE MESSAGE</h3>
            <p className={`font-body text-sm mb-6 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
              This will permanently delete the message. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className={`flex-1 font-mono text-[11px] tracking-widest py-2.5 rounded-xl border transition-all ${dark ? "border-dark-border text-dark-muted hover:border-dark-accent" : "border-light-border text-light-muted hover:border-light-accent"}`}
              >CANCEL</button>
              <button
                onClick={() => { onDeleteMessage(deleteTargetId); setDeleteTargetId(null); }}
                className="flex-1 font-mono text-[11px] tracking-widest py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-all"
              >DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
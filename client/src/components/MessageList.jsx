import { useEffect, useRef } from "react";

export default function MessageList({ messages, user, typingUsers = [] }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]); // Scroll when messages OR typing changes

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((m) => {
        // ✅ FIX: Handle both populated and non-populated sender
        const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
        const isMine = String(senderId) === String(user._id);

        return (
          <div
            key={m._id}
            className={`max-w-xs p-2 rounded-lg ${
              isMine
                ? "bg-blue-600 ml-auto"
                : "bg-zinc-700"
            }`}
          >
            {m.text}
          </div>
        );
      })}

      {/* ✨ Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm italic">
          <div className="flex gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
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
    </div>
  );
}
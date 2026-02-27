import { useEffect, useRef } from "react";
import { formatTimestamp, formatFullTimestamp } from "../utils/formatTimestamp";

export default function MessageList({ messages, user, typingUsers = [] }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((m) => {
        // Handle both populated and non-populated sender
        const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
        const senderName = typeof m.sender === 'object' ? m.sender.username : null;
        const isMine = String(senderId) === String(user._id);

        return (
          <div
            key={m._id}
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
          >
            {/* Message bubble */}
            <div
              className={`max-w-xs p-2 rounded-lg ${
                isMine
                  ? "bg-blue-600"
                  : "bg-zinc-700"
              }`}
            >
              {/* Show sender name for received messages */}
              {!isMine && senderName && (
                <div className="text-xs text-zinc-400 mb-1 font-semibold">
                  {senderName}
                </div>
              )}
              
              {/* Message text */}
              <div className="break-words">
                {m.text}
              </div>
            </div>

            {/* Timestamp */}
            {m.createdAt && (
              <div 
                className="text-xs text-zinc-500 mt-1 px-1"
                title={formatFullTimestamp(m.createdAt)} // Full date on hover
              >
                {formatTimestamp(m.createdAt)}
              </div>
            )}
          </div>
        );
      })}

      {/* Typing Indicator */}
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
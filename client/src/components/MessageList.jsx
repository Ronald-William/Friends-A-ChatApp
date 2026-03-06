import { useEffect, useRef, useState } from "react";
import { formatTimestamp, formatFullTimestamp } from "../utils/formatTimestamp";

export default function MessageList({ messages, user, typingUsers = [], onDeleteMessage }) {
  const bottomRef = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
            <div className="flex items-center gap-2">
              {/* Delete button — only on my messages, only on hover */}
              {isMine && hoveredId === m._id && (
                <button
                  onClick={() => setDeleteTargetId(m._id)}
                  className="text-red-500 hover:text-red-300 text-sm font-bold transition-colors"
                  title="Delete message"
                >
                  Delete
                </button>
              )}

              {/* Message bubble */}
              <div className={`max-w-xs p-2 rounded-lg ${isMine ? "bg-blue-600" : "bg-zinc-700"}`}>
                {!isMine && senderName && (
                  <div className="text-xs text-zinc-400 mb-1 font-semibold">{senderName}</div>
                )}
                <div className="break-words">{m.text}</div>
              </div>
            </div>

            {/* Timestamp */}
            {m.createdAt && (
              <div
                className="text-xs text-zinc-500 mt-1 px-1"
                title={formatFullTimestamp(m.createdAt)}
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

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 w-72 shadow-xl">
            <h3 className="text-white font-semibold mb-2">Delete Message</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This will permanently delete the message. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteMessage(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
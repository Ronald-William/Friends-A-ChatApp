import { useState, useRef } from "react";
import { sendMessage } from "../services/chatApi";

export default function MessageInput({ convoId, user, socket, onNew, onError }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || !convoId) return;
    const messageText = text.trim();

    // Stop typing indicator when sending
    if (isTypingRef.current) {
      socket.emit("stopTyping", {
        conversationId: convoId,
        userId: user._id
      });
      isTypingRef.current = false;
    }
    setSending(true);
    setText("");

    try {
      const res = await sendMessage({
        conversationId: convoId,
        text: messageText
      });

      onNew(res.data);

    }
    catch (error) {
      console.log("Failed to send message: ", error);
      setText(messageText);
      if (onError) {
        const errorMessage = error.response?.status === 403
          ? "You don't have permission to send messages in this conversation"
          : error.response?.status === 404
            ? "Conversation not found"
            : error.message === "Network Error"
              ? "Network error. Please check your connection and try again"
              : "Failed to send message. Please try again";

        onError(errorMessage);
      }
    }
    finally {
      setSending(false);
    }
  }


  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);

    if (!value.trim()) {
      // Empty input - stop typing
      if (isTypingRef.current) {
        socket.emit("stopTyping", {
          conversationId: convoId,
          userId: user._id
        });
        isTypingRef.current = false;
      }
      return;
    }

    // User is typing
    if (!isTypingRef.current) {
      socket.emit("typing", {
        conversationId: convoId,
        userId: user._id,
        username: user.username
      });
      isTypingRef.current = true;
    }

    // Reset the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("stopTyping", {
          conversationId: convoId,
          userId: user._id
        });
        isTypingRef.current = false;
      }
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t border-zinc-800">
      <input
        className="flex-1 bg-zinc-800 p-2 rounded"
        value={text}
        onChange={handleTyping}
        onKeyDown={handleKeyPress}
        placeholder={sending ? "sending" : "Type message..."}
        disabled={sending}
      />

      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="px-4 bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed"
      >
        {sending ? "..." : "Send"}
      </button>
    </div>
  );
};
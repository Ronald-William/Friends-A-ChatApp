import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/chatApi";

import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

const socket = io("http://localhost:5000", {
  withCredentials: true
});

export default function Chat() {
  const { user } = useAuth();

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // ✨ NEW
  const [typingUsers, setTypingUsers] = useState({}); // ✨ NEW: Typing indicators

  // Socket connection status
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // ✨ NEW: Handle initial online users list
    socket.on("initialOnlineUsers", (userIds) => {
      console.log("Initial online users:", userIds);
      setOnlineUsers(new Set(userIds));
    });

    // ✨ NEW: Handle user coming online
    socket.on("userOnline", (userId) => {
      console.log("User came online:", userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    // ✨ NEW: Handle user going offline
    socket.on("userOffline", (userId) => {
      console.log("User went offline:", userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // ✨ NEW: Handle typing events
    socket.on("userTyping", ({ conversationId, userId, username }) => {
      console.log(`${username} is typing in ${conversationId}`);
      
      setTypingUsers(prev => {
        const conversationTypers = prev[conversationId] || [];
        // Add user if not already in the list
        if (!conversationTypers.find(u => u.userId === userId)) {
          return {
            ...prev,
            [conversationId]: [...conversationTypers, { userId, username }]
          };
        }
        return prev;
      });
    });

    socket.on("userStoppedTyping", ({ conversationId, userId }) => {
      console.log(`User ${userId} stopped typing in ${conversationId}`);
      
      setTypingUsers(prev => {
        const conversationTypers = prev[conversationId] || [];
        const filtered = conversationTypers.filter(u => u.userId !== userId);
        
        return {
          ...prev,
          [conversationId]: filtered
        };
      });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("initialOnlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, []);

  // Join user's room
  useEffect(() => {
    if (!user) {
      console.warn("No user found, cannot join socket room");
      return;
    }
    
    console.log("Joining room for user:", user._id);
    socket.emit("joinUser", user._id);


    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat", user._id);
      console.log("Heartbeat sent");
    }, 240000);

    return () => clearInterval(heartbeatInterval);
  }, [user]);

  // Load messages and join conversation room when conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    // Join the conversation room for real-time updates
    console.log("Joining conversation room:", activeId);
    socket.emit("joinConversation", activeId);

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Loading messages for conversation:", activeId);
        const res = await getMessages(activeId);
        
        console.log("Messages loaded:", res.data);
        setMessages(res.data || []);
      } catch (err) {
        console.error("Error loading messages:", err);
        setError(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    load();

    // Cleanup: leave the conversation room when switching
    return () => {
      console.log("Leaving conversation room:", activeId);
      socket.emit("leaveConversation", activeId);
    };
  }, [activeId]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      console.log("New message received via socket:", msg);
      
      if (msg.conversation === activeId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => socket.off("newMessage", handleNewMessage);
  }, [activeId]);

  return (
    <div className="h-screen bg-black text-white flex">
      <Sidebar 
        activeId={activeId} 
        setActiveId={setActiveId}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col">
        {activeId ? (
          <>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Loading messages...
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-red-500">
                Error: {error}
              </div>
            ) : (
              <>
                <MessageList 
                  messages={messages} 
                  user={user}
                  typingUsers={typingUsers[activeId] || []}
                />
                <MessageInput
                  convoId={activeId}
                  user={user}
                  socket={socket}
                  onNew={(msg) => {
                    console.log("Message sent:", msg);
                  }}
                />
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
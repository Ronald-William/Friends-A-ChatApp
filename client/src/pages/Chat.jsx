import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getMessages, getUnreadCounts, markConversationAsRead, deleteMessage, getConversations } from "../services/chatApi";
import Toast from "../components/Toast";

import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import GroupInfoPanel from "../components/GroupInfoPanel";

const socket = io("http://localhost:5000", { withCredentials: true });

export default function Chat() {
  const { user } = useAuth();

  const [activeId, setActiveId] = useState(null);
  const [activeConvo, setActiveConvo] = useState(null); // full convo object for group info
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [toast, setToast] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Socket events
  useEffect(() => {
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("connect_error", (err) => console.error("Socket connection error:", err));

    socket.on("initialOnlineUsers", (userIds) => setOnlineUsers(new Set(userIds)));
    socket.on("userOnline", (userId) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on("userOffline", (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("userTyping", ({ conversationId, userId, username }) => {
      setTypingUsers(prev => {
        const typers = prev[conversationId] || [];
        if (!typers.find(u => u.userId === userId)) {
          return { ...prev, [conversationId]: [...typers, { userId, username }] };
        }
        return prev;
      });
    });

    socket.on("userStoppedTyping", ({ conversationId, userId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(u => u.userId !== userId)
      }));
    });

    socket.on("unreadCountUpdate", ({ conversationId, count }) => {
      setActiveId(currentActiveId => {
        if (currentActiveId !== conversationId) {
          setUnreadCounts(prev => ({ ...prev, [conversationId]: count }));
        }
        return currentActiveId;
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("initialOnlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("unreadCountUpdate");
      socket.off("messageDeleted");
    };
  }, []);

  // Join user room + load unread counts
  useEffect(() => {
    if (!user) return;

    socket.emit("joinUser", user._id);

    getUnreadCounts()
      .then(res => setUnreadCounts(res.data || {}))
      .catch(err => console.error("Failed to load unread counts:", err));

    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat", user._id);
    }, 240000);

    return () => clearInterval(heartbeatInterval);
  }, [user]);

  // Load conversations list (needed to resolve activeConvo)
  useEffect(() => {
    if (!user) return;
    getConversations()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setConvos(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to load conversations:", err));
  }, [user]);

  // Resolve activeConvo when activeId changes
  useEffect(() => {
    if (!activeId) {
      setActiveConvo(null);
      setShowGroupInfo(false);
      return;
    }
    const found = convos.find(c => c._id === activeId);
    setActiveConvo(found || null);
    setShowGroupInfo(false);
  }, [activeId, convos]);

  // Load messages + mark as read
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    socket.emit("joinConversation", activeId);

    markConversationAsRead(activeId)
      .then(() => setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[activeId];
        return next;
      }))
      .catch(err => console.error("Failed to mark as read:", err));

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMessages(activeId);
        setMessages(res.data || []);
      } catch (err) {
        const errorMsg = err.message || "Failed to load messages";
        setError(errorMsg);
        setToast({ message: errorMsg, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => socket.emit("leaveConversation", activeId);
  }, [activeId]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.conversation === activeId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [activeId]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (err) {
      setToast({ message: "Failed to delete message", type: "error" });
    }
  };

  const handleGroupLeft = () => {
    setActiveId(null);
    // Reload conversations in sidebar via re-fetch
    getConversations()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setConvos(Array.isArray(data) ? data : []);
      });
  };

  const handleGroupDisbanded = () => {
    setActiveId(null);
    getConversations()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setConvos(Array.isArray(data) ? data : []);
      });
  };

  const handleMemberChange = (updatedConvo) => {
    setActiveConvo(updatedConvo);
    setConvos(prev => prev.map(c => c._id === updatedConvo._id ? { ...c, ...updatedConvo } : c));
  };

  // Chat header — shows name + group info button
  const renderHeader = () => {
    if (!activeConvo) return null;

    const title = activeConvo.isGroup
      ? activeConvo.groupName
      : activeConvo.friend?.username || "Chat";

    return (
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        {activeConvo.isGroup && (
          <button
            onClick={() => setShowGroupInfo(prev => !prev)}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            {showGroupInfo ? "Hide Info" : "Group Info"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-black text-white flex">
      <Sidebar
        activeId={activeId}
        setActiveId={setActiveId}
        onlineUsers={onlineUsers}
        unreadCounts={unreadCounts}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {activeId ? (
            <>
              {renderHeader()}
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
                    onDeleteMessage={handleDeleteMessage}
                  />
                  <MessageInput
                    convoId={activeId}
                    user={user}
                    socket={socket}
                    onNew={(msg) => console.log("Message sent:", msg)}
                    onError={(msg) => setToast({ message: msg, type: "error" })}
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

        {/* Group info panel */}
        {showGroupInfo && activeConvo?.isGroup && (
          <GroupInfoPanel
            convo={activeConvo}
            currentUser={user}
            onClose={() => setShowGroupInfo(false)}
            onLeft={handleGroupLeft}
            onDisbanded={handleGroupDisbanded}
            onMemberChange={handleMemberChange}
          />
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
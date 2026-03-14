import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getMessages, getUnreadCounts, markConversationAsRead, deleteMessage, getConversations } from "../services/chatApi";
import Toast from "../components/Toast";

import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import GroupInfoPanel from "../components/GroupInfoPanel";
import ProfileCard from "../components/ProfileCard";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { withCredentials: true });

export default function Chat() {
  const { user } = useAuth();
  const { dark } = useTheme();

  const [activeId, setActiveId] = useState(null);
  const [activeConvo, setActiveConvo] = useState(null);
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [toast, setToast] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await getConversations();
      const data = res.data?.data || res.data || [];
      setConvos(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Failed to load conversations:", err);
      return [];
    }
  };

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

    // New group appeared in sidebar (created or added as member)
    socket.on("groupCreated", (group) => {
      setConvos(prev => {
        const exists = prev.find(c => c._id === group._id);
        if (exists) return prev;
        return [...prev, group];
      });
    });

    // Group membership changed — update the group in convos list
    socket.on("groupUpdated", ({ convoId, group }) => {
      setConvos(prev => prev.map(c => c._id === convoId ? { ...c, ...group } : c));
      setActiveConvo(prev => prev?._id === convoId ? { ...prev, ...group } : prev);
    });

    // Group was disbanded or current user was removed
    socket.on("groupRemoved", ({ convoId }) => {
      setConvos(prev => prev.filter(c => c._id !== convoId));
      setActiveId(prev => {
        if (prev === convoId) {
          setActiveConvo(null);
          setShowGroupInfo(false);
          setMessages([]);
        }
        return prev === convoId ? null : prev;
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
      socket.off("unreadCountUpdate");
      socket.off("messageDeleted");
      socket.off("groupCreated");
      socket.off("groupUpdated");
      socket.off("groupRemoved");
    };
  }, []);

  // Join user room + load initial data
  useEffect(() => {
    if (!user) return;

    socket.emit("joinUser", user._id);

    getUnreadCounts()
      .then(res => setUnreadCounts(res.data || {}))
      .catch(err => console.error("Failed to load unread counts:", err));

    loadConversations();

    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat", user._id);
    }, 240000);

    return () => clearInterval(heartbeatInterval);
  }, [user]);

  // Resolve activeConvo when activeId or convos changes
  useEffect(() => {
    if (!activeId) {
      setActiveConvo(null);
      setShowGroupInfo(false);
      return;
    }
    const found = convos.find(c => c._id === activeId);
    setActiveConvo(found || null);
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
    setConvos(prev => prev.filter(c => c._id !== activeId));
    setActiveId(null);
    setShowGroupInfo(false);
  };

  const handleGroupDisbanded = () => {
    setConvos(prev => prev.filter(c => c._id !== activeId));
    setActiveId(null);
    setShowGroupInfo(false);
  };

  const handleMemberChange = (updatedConvo) => {
    setActiveConvo(updatedConvo);
    setConvos(prev => prev.map(c => c._id === updatedConvo._id ? { ...c, ...updatedConvo } : c));
  };

  const renderHeader = () => {
    if (!activeConvo) return null;
    const isDM = !activeConvo.isGroup;
    const title = activeConvo.isGroup ? activeConvo.groupName : activeConvo.friend?.username || "Chat";

    return (
      <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${dark ? "border-dark-border bg-dark-surface" : "border-light-border bg-light-surface"}`}>
        <div className="flex items-center gap-3">
          {/* Back button — mobile only */}
          <button
            onClick={() => setActiveId(null)}
            className={`md:hidden font-mono text-sm transition-colors ${dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}
          >←</button>
          {isDM ? (
            <button onClick={() => setProfileUser(activeConvo.friend)} className={`font-display text-xl tracking-wide transition-colors hover:opacity-70 ${dark ? "text-dark-text" : "text-light-text"}`}>{title}</button>
          ) : (
            <span className={`font-display text-xl tracking-wide ${dark ? "text-dark-text" : "text-light-text"}`}>{title}</span>
          )}
        </div>
        {activeConvo.isGroup && (
          <button onClick={() => setShowGroupInfo(prev => !prev)} className={`font-mono text-[11px] tracking-widest transition-colors ${dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}>
            {showGroupInfo ? "HIDE INFO" : "GROUP INFO"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen flex overflow-hidden ${dark ? "bg-dark-bg text-dark-text" : "bg-light-bg text-light-text"}`}>
      <Sidebar
        activeId={activeId}
        setActiveId={setActiveId}
        onlineUsers={onlineUsers}
        unreadCounts={unreadCounts}
        convos={convos}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={loadConversations}
      />

      {/* Main area — hidden on mobile when a chat is active */}
      <div className={`flex-1 flex overflow-hidden ${activeId ? "flex" : "flex"}`}>
        <div className={`flex-1 flex flex-col min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}>
          {activeId ? (
            <>
              {renderHeader()}
              {loading ? (
                <div className={`flex-1 flex items-center justify-center font-mono text-[11px] tracking-widest ${dark ? "text-dark-muted" : "text-light-muted"}`}>loading messages...</div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center font-mono text-[11px] text-red-400">{error}</div>
              ) : (
                <>
                  <MessageList
                    messages={messages}
                    user={user}
                    typingUsers={typingUsers[activeId] || []}
                    onDeleteMessage={handleDeleteMessage}
                    onSenderClick={activeConvo?.isGroup ? null : (sender) => setProfileUser(sender)}
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
            <div className={`flex-1 flex flex-col ${dark ? "bg-dark-bg" : "bg-light-bg"}`}>
              {/* Mobile top bar when no chat selected */}
              <div className={`md:hidden flex items-center px-4 py-3 border-b ${dark ? "border-dark-border bg-dark-surface" : "border-light-border bg-light-surface"}`}>
                <button onClick={() => setSidebarOpen(true)} className={`font-mono text-lg ${dark ? "text-dark-text" : "text-light-text"}`}>☰</button>
                <span className={`font-display text-lg tracking-widest ml-3 ${dark ? "text-dark-text" : "text-light-text"}`}>YAPPER HUB</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
                <img src="/friends-door.jpeg" alt="Select a chat" className="w-40 md:w-48 opacity-30" />
                <p className={`font-body italic text-base md:text-lg text-center ${dark ? "text-dark-muted" : "text-light-muted"}`}>
                  "Knock Knock..."
                </p>
                <p className={`font-mono text-[11px] tracking-widest text-center ${dark ? "text-dark-muted" : "text-light-muted"}`}>
                  SELECT A CHAT TO START MESSAGING
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`md:hidden font-mono text-[11px] tracking-widest px-6 py-2.5 rounded-xl border transition-all mt-2 ${dark ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text" : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}
                >OPEN CHATS →</button>
              </div>
            </div>
          )}
        </div>

        {/* On mobile, show chat list when no active chat */}
        {!activeId && (
          <div className={`md:hidden flex-1 flex flex-col ${dark ? "bg-dark-bg" : "bg-light-bg"}`}>
            <div className={`flex items-center px-4 py-3 border-b ${dark ? "border-dark-border bg-dark-surface" : "border-light-border bg-light-surface"}`}>
              <button onClick={() => setSidebarOpen(true)} className={`font-mono text-lg mr-3 ${dark ? "text-dark-text" : "text-light-text"}`}>☰</button>
              <span className={`font-display text-lg tracking-widest ${dark ? "text-dark-text" : "text-light-text"}`}>YAPPER HUB</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
              <img src="/friends-door.jpeg" alt="Select a chat" className="w-40 opacity-30" />
              <p className={`font-body italic text-base text-center ${dark ? "text-dark-muted" : "text-light-muted"}`}>
                "Knock Knock..."
              </p>
              <button
                onClick={() => setSidebarOpen(true)}
                className={`font-mono text-[11px] tracking-widest px-6 py-2.5 rounded-xl border transition-all ${dark ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text" : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}
              >OPEN CHATS →</button>
            </div>
          </div>
        )}

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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {profileUser && (
        <ProfileCard
          user={profileUser}
          isOnline={onlineUsers.has(profileUser._id)}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  );
}
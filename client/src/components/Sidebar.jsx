import { useEffect, useState } from "react";
import AddFriendModal from "./AddFriendModal";
import FriendRequests from "./FriendRequests";
import CreateGroupModal from "./CreateGroupModal";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activeId, setActiveId, onlineUsers = new Set(), unreadCounts = {}, convos = [], open, onClose, onNewConversation }) {
  const [friends, setFriends] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations");
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const loadFriends = async () => {
    try { const res = await api.get("/friends"); setFriends(Array.isArray(res.data) ? res.data : []); }
    catch { setFriends([]); }
  };
  const loadRequestsCount = async () => {
    try { const res = await api.get("/friends/requests"); setRequestsCount(Array.isArray(res.data) ? res.data.length : 0); }
    catch { setRequestsCount(0); }
  };

  useEffect(() => { loadFriends(); loadRequestsCount(); setLoading(false); }, []);

  const handleRequestHandled = (newConversation) => {
    loadFriends(); loadRequestsCount();
    onNewConversation?.();
    if (newConversation?._id) { setTimeout(() => { setActiveId(newConversation._id); setActiveTab("conversations"); onClose?.(); }, 500); }
    else { setActiveTab("conversations"); }
  };

  const handleGroupCreated = (newGroup) => {
    setTimeout(() => { setActiveId(newGroup._id); setActiveTab("conversations"); onClose?.(); }, 300);
  };

  const handleFriendClick = async (friend) => {
    const existing = convos.find(c => !c.isGroup && c.participants?.some(p => p._id === friend._id));
    if (existing) { setActiveId(existing._id); setActiveTab("conversations"); onClose?.(); return; }
    try {
      const res = await api.post("/conversations", { friendUsername: friend.username });
      if (res.data._id) { setActiveId(res.data._id); setActiveTab("conversations"); onClose?.(); }
    } catch (err) { console.error("Error creating conversation:", err); }
  };

  const handleConvoClick = (id) => { setActiveId(id); onClose?.(); };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  const d = dark;

  const tabClass = (tab) => `flex-1 py-2 font-mono text-[10px] tracking-widest transition-colors relative ${activeTab === tab
    ? d ? "text-dark-text border-b-2 border-dark-accent" : "text-light-text border-b-2 border-light-accent"
    : d ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`;

  const initials = (user?.name || user?.username || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const sidebarContent = (
    <div className={`w-64 h-full flex flex-col border-r ${d ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}>

      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${d ? "border-dark-border" : "border-light-border"}`}>
        <span className={`font-brand text-lg tracking-widest ${d ? "text-dark-text" : "text-light-text"}`}>YAPPER HUB</span>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`font-mono text-[10px] tracking-widest px-2 py-1 rounded-lg border transition-all ${d ? "bg-dark-bg border-dark-border text-dark-muted hover:text-dark-text" : "bg-light-bg border-light-border text-light-muted hover:text-light-text"}`}>
            {d ? "☀" : "◑"}
          </button>
          {/* Close button — mobile only */}
          <button onClick={onClose} className={`md:hidden font-mono text-sm transition-colors ${d ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}>✕</button>
        </div>
      </div>

      {/* User info */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${d ? "border-dark-border" : "border-light-border"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 ${d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-mono text-[11px] tracking-wider truncate ${d ? "text-dark-text" : "text-light-text"}`}>@{user?.username}</div>
          <div className={`font-mono text-[9px] tracking-widest ${d ? "text-dark-muted" : "text-light-muted"}`}>ONLINE</div>
        </div>
        <button onClick={logout} className={`font-mono text-[20px] transition-colors ${d ? "text-dark-muted hover:text-red-400" : "text-light-muted hover:text-red-500"}`} title="Logout">⏻</button>
      </div>

      {/* Action buttons */}
      <div className={`flex gap-2 p-3 border-b ${d ? "border-dark-border" : "border-light-border"}`}>
        <button onClick={() => setShowAddFriend(true)} className={`flex-1 font-mono text-[10px] tracking-widest py-2 rounded-lg border transition-all hover:-translate-y-0.5 ${d ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text" : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}>+ FRIEND</button>
        <button onClick={() => setShowCreateGroup(true)} className={`flex-1 font-mono text-[10px] tracking-widest py-2 rounded-lg transition-all hover:-translate-y-0.5 ${d ? "bg-dark-text text-dark-bg" : "bg-light-accent text-light-bg"}`}>+ GROUP</button>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${d ? "border-dark-border" : "border-light-border"}`}>
        <button className={tabClass("conversations")} onClick={() => setActiveTab("conversations")}>
          CHATS
          {totalUnread > 0 && <span className={`absolute -top-0.5 right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${d ? "bg-dark-accent text-dark-text" : "bg-light-accent text-light-bg"}`}>{totalUnread > 9 ? "9+" : totalUnread}</span>}
        </button>
        <button className={tabClass("requests")} onClick={() => setActiveTab("requests")}>
          REQ
          {requestsCount > 0 && <span className="absolute -top-0.5 right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-red-500 text-white">{requestsCount}</span>}
        </button>
        <button className={tabClass("friends")} onClick={() => setActiveTab("friends")}>FRIENDS</button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className={`p-4 font-mono text-[11px] text-center ${d ? "text-dark-muted" : "text-light-muted"}`}>loading...</div>}

        {!loading && activeTab === "conversations" && (
          convos.length === 0
            ? <div className={`p-6 font-mono text-[11px] text-center ${d ? "text-dark-muted" : "text-light-muted"}`}>no conversations yet</div>
            : convos.map(c => {
                const isGroup = c.isGroup;
                const displayName = isGroup ? c.groupName : c.friend?.username || "Unknown";
                const friend = !isGroup ? c.friend : null;
                const isOnline = !isGroup && onlineUsers.has(friend?._id);
                const unread = unreadCounts[c._id] || 0;
                const isActive = activeId === c._id;
                return (
                  <div key={c._id} onClick={() => handleConvoClick(c._id)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? d ? "bg-dark-surface2" : "bg-light-surface2" : d ? "hover:bg-dark-surface2/50" : "hover:bg-light-surface2/50"}`}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm ${isGroup ? d ? "bg-dark-accent/40 text-dark-text" : "bg-light-accent/30 text-light-text" : d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>
                        {isGroup ? "#" : (displayName || "?")[0].toUpperCase()}
                      </div>
                      {!isGroup && <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border ${d ? "border-dark-surface" : "border-light-surface"} ${isOnline ? "bg-green-500" : d ? "bg-dark-border" : "bg-light-border"}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-mono text-[11px] tracking-wide truncate ${unread > 0 ? d ? "text-dark-text font-bold" : "text-light-text font-bold" : d ? "text-dark-muted" : "text-light-muted"}`}>{displayName}</span>
                        {unread > 0 && !isActive && <span className={`flex-shrink-0 font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${d ? "bg-dark-accent text-dark-text" : "bg-light-accent text-light-bg"}`}>{unread > 9 ? "9+" : unread}</span>}
                      </div>
                      {isGroup && <div className={`font-mono text-[9px] tracking-widest ${d ? "text-dark-muted" : "text-light-muted"}`}>{c.participants?.length || 0} members</div>}
                    </div>
                  </div>
                );
              })
        )}

        {!loading && activeTab === "requests" && <FriendRequests onRequestHandled={handleRequestHandled} />}

        {!loading && activeTab === "friends" && (
          friends.length === 0
            ? <div className={`p-6 font-mono text-[11px] text-center ${d ? "text-dark-muted" : "text-light-muted"}`}>no friends yet</div>
            : friends.map(friend => {
                const isOnline = onlineUsers.has(friend._id);
                return (
                  <div key={friend._id} onClick={() => handleFriendClick(friend)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${d ? "hover:bg-dark-surface2/50" : "hover:bg-light-surface2/50"}`}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm ${d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>{(friend.username || "?")[0].toUpperCase()}</div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border ${d ? "border-dark-surface" : "border-light-surface"} ${isOnline ? "bg-green-500" : d ? "bg-dark-border" : "bg-light-border"}`} />
                    </div>
                    <div>
                      <div className={`font-mono text-[11px] tracking-wide ${d ? "text-dark-text" : "text-light-text"}`}>{friend.username}</div>
                      {friend.name && <div className={`font-mono text-[9px] ${d ? "text-dark-muted" : "text-light-muted"}`}>{friend.name}</div>}
                    </div>
                  </div>
                );
              })
        )}
      </div>

      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} onRequestSent={() => {}} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onGroupCreated={handleGroupCreated} />}
    </div>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile — overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
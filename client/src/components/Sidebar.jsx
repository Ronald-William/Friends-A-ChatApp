import { useEffect, useState } from "react";
import { getConversations } from "../services/chatApi";
import AddFriendModal from "./AddFriendModal";
import FriendRequests from "./FriendRequests";
import CreateGroupModal from "./CreateGroupModal";
import api from "../services/api";

export default function Sidebar({ activeId, setActiveId, onlineUsers = new Set(), unreadCounts = {} }) {
  const [convos, setConvos] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations");

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConversations();

      let conversationsData;
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        conversationsData = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        conversationsData = res.data;
      } else {
        conversationsData = [];
      }

      setConvos(conversationsData);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
      setConvos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFriends([]);
    }
  };

  const loadRequestsCount = async () => {
    try {
      const res = await api.get("/friends/requests");
      setRequestsCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (err) {
      setRequestsCount(0);
    }
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
    loadRequestsCount();
  }, []);

  const handleRequestHandled = (newConversation) => {
    loadConversations();
    loadFriends();
    loadRequestsCount();

    if (newConversation && newConversation._id) {
      setTimeout(() => {
        setActiveId(newConversation._id);
        setActiveTab("conversations");
      }, 500);
    } else {
      setActiveTab("conversations");
    }
  };

  const handleGroupCreated = (newGroup) => {
    loadConversations();
    setTimeout(() => {
      setActiveId(newGroup._id);
      setActiveTab("conversations");
    }, 300);
  };

  const handleFriendClick = async (friend) => {
    const existingConvo = convos.find(c =>
      !c.isGroup && c.participants?.some(p => p._id === friend._id)
    );

    if (existingConvo) {
      setActiveId(existingConvo._id);
      setActiveTab("conversations");
    } else {
      try {
        const res = await api.post("/conversations", { friendUsername: friend.username });
        await loadConversations();
        if (res.data._id) {
          setActiveId(res.data._id);
          setActiveTab("conversations");
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
      }
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto flex flex-col">
      <h2 className="p-4 font-semibold text-lg">Chats</h2>

      {/* Action buttons */}
      <div className="flex gap-2 mx-4 mb-4">
        <button
          className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
          onClick={() => setShowAddFriend(true)}
        >
          + Friend
        </button>
        <button
          className="flex-1 p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors text-sm"
          onClick={() => setShowCreateGroup(true)}
        >
          + Group
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mx-4 text-xs">
        <button
          className={`flex-1 py-2 font-medium transition-colors relative ${activeTab === "conversations" ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setActiveTab("conversations")}
        >
          Chats
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 font-medium transition-colors relative ${activeTab === "requests" ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setActiveTab("requests")}
        >
          Requests
          {requestsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {requestsCount}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 font-medium transition-colors ${activeTab === "friends" ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
          onClick={() => setActiveTab("friends")}
        >
          Friends ({Array.isArray(friends) ? friends.length : 0})
        </button>
      </div>

      {loading && <div className="p-4 text-center text-zinc-500">Loading...</div>}

      {error && (
        <div className="p-4 text-center text-red-500 text-sm">
          Error: {error}
          <button
            onClick={() => { loadConversations(); loadFriends(); loadRequestsCount(); }}
            className="block mx-auto mt-2 text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Conversations Tab */}
      {!loading && !error && activeTab === "conversations" && (
        <>
          {convos.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No conversations yet.
            </div>
          ) : (
            <div className="flex-1">
              {convos.map((c) => {
                const isGroup = c.isGroup;
                const displayName = isGroup
                  ? c.groupName
                  : c.friend?.username || c.friend?.name || "Unknown";

                const friend = !isGroup ? c.friend : null;
                const isOnline = !isGroup && onlineUsers.has(friend?._id);
                const unread = unreadCounts[c._id] || 0;
                const isActive = activeId === c._id;

                return (
                  <div
                    key={c._id}
                    onClick={() => setActiveId(c._id)}
                    className={`p-3 cursor-pointer hover:bg-zinc-800 transition-colors ${isActive ? "bg-zinc-800" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Online dot for DMs, group icon for groups */}
                      {isGroup ? (
                        <div className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center text-xs flex-shrink-0">
                          #
                        </div>
                      ) : (
                        <div className={`w-2 h-2 flex-shrink-0 rounded-full ${isOnline ? "bg-green-500" : "bg-zinc-600"}`} />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-medium truncate ${unread > 0 ? "text-white" : "text-zinc-300"}`}>
                            {displayName}
                          </span>
                          {unread > 0 && !isActive && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                        {isGroup && (
                          <div className="text-xs text-zinc-500">
                            {c.participants?.length || 0} members
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loading && !error && activeTab === "requests" && (
        <FriendRequests onRequestHandled={handleRequestHandled} />
      )}

      {!loading && !error && activeTab === "friends" && (
        <>
          {friends.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">No friends yet.</div>
          ) : (
            <div className="flex-1">
              {friends.map((friend) => {
                const isOnline = onlineUsers.has(friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => handleFriendClick(friend)}
                    className="p-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-zinc-600"}`} />
                      <div>
                        <div className="font-medium">{friend.username}</div>
                        {friend.name && <div className="text-sm text-zinc-500">{friend.name}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddFriend && (
        <AddFriendModal onClose={() => setShowAddFriend(false)} onRequestSent={() => {}} />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
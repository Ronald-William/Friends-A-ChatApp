import { useEffect, useState } from "react";
import { getConversations } from "../services/chatApi";
import AddFriendModal from "./AddFriendModal";
import FriendRequests from "./FriendRequests";
import api from "../services/api";

export default function Sidebar({ activeId, setActiveId, onlineUsers = new Set(), unreadCounts={} }) {
  const [convos, setConvos] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations"); // "conversations", "friends", or "requests"

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getConversations();

      console.log("API Response:", res);
      console.log("Conversations data:", res.data);
      console.log("Type of res.data:", typeof res.data);
      console.log("Is array?", Array.isArray(res.data));

      // Handle both {data: [...]} and direct array responses
      let conversationsData;
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        conversationsData = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        conversationsData = res.data;
      } else if (Array.isArray(res.data)) {
        conversationsData = res.data;
      } else {
        console.warn("Unexpected response format:", res);
        conversationsData = [];
      }

      console.log("Final conversations array:", conversationsData);

      if (conversationsData.length > 0) {
        conversationsData.forEach((convo, index) => {
          console.log(`Conversation ${index}:`, convo);
        });
      }

      setConvos(conversationsData);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError(err.message || "Failed to load conversations");
      setConvos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await api.get("/friends");
      console.log("Friends response:", res);
      console.log("Friends data:", res.data);

      const friendsData = Array.isArray(res.data) ? res.data : [];
      setFriends(friendsData);
    } catch (err) {
      console.error("Error loading friends:", err);
      setFriends([]);
    }
  };

  const loadRequestsCount = async () => {
    try {
      const res = await api.get("/friends/requests");
      const requests = Array.isArray(res.data) ? res.data : [];
      setRequestsCount(requests.length);
    } catch (err) {
      console.error("Error loading requests count:", err);
      setRequestsCount(0);
    }
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
    loadRequestsCount();
  }, []);

  const handleRequestSent = () => {
    console.log("Friend request sent");
    // No need to reload anything, just close modal
  };

  const handleRequestHandled = (newConversation) => {
    console.log("Friend request handled (accepted/rejected)");
    console.log("New conversation:", newConversation);

    // Reload everything
    loadConversations();
    loadFriends();
    loadRequestsCount();

    // If a conversation was created (accepted), auto-select it
    if (newConversation && newConversation._id) {
      setTimeout(() => {
        setActiveId(newConversation._id);
        setActiveTab("conversations");
      }, 500); // Small delay to let conversations load
    } else {
      // Just switch to conversations tab
      setActiveTab("conversations");
    }
  };

  const handleFriendClick = async (friend) => {
    console.log("Friend clicked:", friend);

    // Find existing conversation with this friend
    const existingConvo = convos.find(c =>
      c.participants?.some(p => p._id === friend._id)
    );

    if (existingConvo) {
      // Conversation exists, open it
      console.log("Found existing conversation:", existingConvo._id);
      setActiveId(existingConvo._id);
      setActiveTab("conversations");
    } else {
      // No conversation yet - this shouldn't happen if friend request was accepted
      // But just in case, let's handle it gracefully
      console.log("No conversation found with friend, this is unusual");

      try {
        // Try to create a conversation
        const res = await api.post("/conversations", {
          friendUsername: friend.username
        });

        console.log("Created conversation:", res.data);

        // Reload conversations
        await loadConversations();

        // Select the new conversation
        if (res.data._id) {
          setActiveId(res.data._id);
          setActiveTab("conversations");
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
        alert("Unable to start conversation. Please try again.");
      }
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);


  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto flex flex-col">
      <h2 className="p-4 font-semibold text-lg">Chats</h2>

      <button
        className="mx-4 mb-4 p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        onClick={() => setShowAddFriend(true)}
      >
        + Add Friend
      </button>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mx-4 text-xs">
        <button
          className={`flex-1 py-2 font-medium transition-colors relative ${activeTab === "conversations"
            ? "text-white border-b-2 border-blue-500"
            : "text-zinc-500 hover:text-zinc-300"
            }`}
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
          className={`flex-1 py-2 font-medium transition-colors relative ${activeTab === "requests"
            ? "text-white border-b-2 border-blue-500"
            : "text-zinc-500 hover:text-zinc-300"
            }`}
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
          className={`flex-1 py-2 font-medium transition-colors ${activeTab === "friends"
            ? "text-white border-b-2 border-blue-500"
            : "text-zinc-500 hover:text-zinc-300"
            }`}
          onClick={() => setActiveTab("friends")}
        >
          Friends ({Array.isArray(friends) ? friends.length : 0})
        </button>
      </div>

      {loading && (
        <div className="p-4 text-center text-zinc-500">Loading...</div>
      )}

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
          {!Array.isArray(convos) || convos.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No conversations yet.<br />
              Accept friend requests to start chatting!
            </div>
          ) : (
            <div className="flex-1">
              {convos.map((c) => {
                const friend = c.friend ||
                  c.participants?.find(p => p._id !== c.participants[0]._id) ||
                  c.participants?.[0];

                const displayName = friend?.username || friend?.name || "Unknown User";
                const isOnline = onlineUsers.has(friend?._id);
                const unread = unreadCounts[c._id] || 0;
                const isActive = activeId === c._id;

                return (
                  <div
                    key={c._id}
                    onClick={() => setActiveId(c._id)}
                    className={`p-3 cursor-pointer hover:bg-zinc-800 transition-colors ${isActive ? "bg-zinc-800" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Online indicator */}
                      <div className={`w-2 h-2 flex-shrink-0 rounded-full ${isOnline ? "bg-green-500" : "bg-zinc-600"}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-medium truncate ${unread > 0 ? "text-white" : "text-zinc-300"}`}>
                            {displayName}
                          </span>
                          {/* Unread badge */}
                          {unread > 0 && !isActive && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                        {c.lastMessage && (
                          <div className={`text-xs truncate ${unread > 0 ? "text-zinc-300 font-medium" : "text-zinc-500"}`}>
                            {c.lastMessage}
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

      {/* Friend Requests Tab */}
      {!loading && !error && activeTab === "requests" && (
        <FriendRequests onRequestHandled={handleRequestHandled} />
      )}

      {/* Friends Tab */}
      {!loading && !error && activeTab === "friends" && (
        <>
          {!Array.isArray(friends) || friends.length === 0 ? (
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
                        {friend.name && (
                          <div className="text-sm text-zinc-500">{friend.name}</div>
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

      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          onRequestSent={() => { }}
        />
      )}
    </div>
  );
}
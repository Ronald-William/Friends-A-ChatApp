import { useState } from "react";
import { createGroup } from "../services/chatApi";
import api from "../services/api";

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // array of friend objects
  const [friends, setFriends] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFriends = async () => {
    if (friendsLoaded) return;
    try {
      const res = await api.get("/friends");
      setFriends(Array.isArray(res.data) ? res.data : []);
      setFriendsLoaded(true);
    } catch (err) {
      setError("Failed to load friends");
    }
  };

  // Load friends on mount
  useState(() => { loadFriends(); }, []);

  const toggleSelect = (friend) => {
    setSelected(prev =>
      prev.find(f => f._id === friend._id)
        ? prev.filter(f => f._id !== friend._id)
        : [...prev, friend]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return setError("Group name is required");
    if (selected.length === 0) return setError("Select at least one member");

    try {
      setLoading(true);
      setError(null);
      const res = await createGroup(groupName, selected.map(f => f.username));
      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const filtered = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-80 shadow-xl flex flex-col gap-4">
        <h3 className="text-white font-semibold text-lg">Create Group</h3>

        {/* Group name input */}
        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="w-full bg-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Friend search */}
        <input
          type="text"
          placeholder="Search friends to add"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-700 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Friend list */}
        <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-2">No friends found</div>
          ) : (
            filtered.map(friend => {
              const isSelected = selected.find(f => f._id === friend._id);
              return (
                <div
                  key={friend._id}
                  onClick={() => toggleSelect(friend)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-600" : "bg-zinc-700 hover:bg-zinc-600"
                  }`}
                >
                  <span className="text-sm text-white">{friend.username}</span>
                  {isSelected && <span className="text-xs text-white">✓</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Selected count */}
        {selected.length > 0 && (
          <div className="text-xs text-zinc-400">
            {selected.length} member{selected.length > 1 ? "s" : ""} selected
          </div>
        )}

        {error && <div className="text-red-400 text-xs">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
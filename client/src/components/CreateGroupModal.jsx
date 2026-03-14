import { useState } from "react";
import { createGroup } from "../services/chatApi";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { dark } = useTheme();
  const d = dark;

  const loadFriends = async () => {
    if (friendsLoaded) return;
    try {
      const res = await api.get("/friends");
      setFriends(Array.isArray(res.data) ? res.data : []);
      setFriendsLoaded(true);
    } catch { setError("Failed to load friends"); }
  };

  useState(() => { loadFriends(); }, []);

  const toggleSelect = (friend) => {
    setSelected(prev => prev.find(f => f._id === friend._id)
      ? prev.filter(f => f._id !== friend._id)
      : [...prev, friend]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return setError("Group name is required");
    if (selected.length === 0) return setError("Select at least one member");
    try {
      setLoading(true); setError(null);
      const res = await createGroup(groupName, selected.map(f => f.username));
      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally { setLoading(false); }
  };

  const filtered = friends.filter(f => f.username.toLowerCase().includes(search.toLowerCase()));

  const inputClass = `w-full font-mono text-sm px-4 py-3 rounded-xl border outline-none transition-all ${d
    ? "bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-muted focus:border-dark-accent"
    : "bg-light-surface2 border-light-border text-light-text placeholder:text-light-muted focus:border-light-accent"}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${d ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}
      >
        <div className={`h-1.5 w-full ${d ? "bg-dark-accent" : "bg-light-accent"}`} />
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 className={`font-brand text-2xl tracking-wide mb-1 ${d ? "text-dark-text" : "text-light-text"}`}>CREATE GROUP</h2>
            
          </div>

          <div>
            <label className={`font-mono text-[11px] tracking-widest uppercase mb-2 block ${d ? "text-dark-muted" : "text-light-muted"}`}>Group Name</label>
            <input
              type="text"
              placeholder="name your group"
              value={groupName}
              onChange={e => { setGroupName(e.target.value); if (error) setError(null); }}
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={`font-mono text-[11px] tracking-widest uppercase mb-2 block ${d ? "text-dark-muted" : "text-light-muted"}`}>Add Members</label>
            <input
              type="text"
              placeholder="search friends..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Friend list */}
          <div className={`max-h-40 overflow-y-auto rounded-xl border ${d ? "border-dark-border" : "border-light-border"}`}>
            {filtered.length === 0 ? (
              <div className={`font-mono text-[11px] text-center py-4 ${d ? "text-dark-muted" : "text-light-muted"}`}>no friends found</div>
            ) : (
              filtered.map(friend => {
                const isSelected = !!selected.find(f => f._id === friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => toggleSelect(friend)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isSelected
                      ? d ? "bg-dark-accent/30" : "bg-light-accent/20"
                      : d ? "hover:bg-dark-surface2/50" : "hover:bg-light-surface2/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-xs ${d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>
                        {friend.username[0].toUpperCase()}
                      </div>
                      <span className={`font-mono text-[11px] tracking-wide ${d ? "text-dark-text" : "text-light-text"}`}>{friend.username}</span>
                    </div>
                    {isSelected && (
                      <span className={`font-mono text-[11px] font-bold ${d ? "text-dark-accent" : "text-light-accent"}`}>✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Selected count */}
          {selected.length > 0 && (
            <div className={`font-mono text-[11px] tracking-widest ${d ? "text-dark-muted" : "text-light-muted"}`}>
              {selected.length} MEMBER{selected.length > 1 ? "S" : ""} SELECTED
            </div>
          )}

          {error && (
            <div className={`font-mono text-[11px] px-4 py-3 rounded-xl border ${d ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-300 text-red-600"}`}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 font-mono text-[11px] tracking-widest py-3 rounded-xl border transition-all ${d ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text" : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}
            >CANCEL</button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`flex-1 font-mono text-[11px] tracking-widest font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${d ? "bg-dark-text text-dark-bg hover:shadow-[0_4px_16px_#D2C1B644]" : "bg-light-accent text-light-bg hover:shadow-[0_4px_16px_#D2535344]"}`}
            >{loading ? "CREATING..." : "CREATE →"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
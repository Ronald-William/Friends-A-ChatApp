import { useState } from "react";
import { addGroupMember, removeGroupMember, leaveGroup, disbandGroup } from "../services/chatApi";

export default function GroupInfoPanel({ convo, currentUser, onClose, onLeft, onDisbanded, onMemberChange }) {
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = convo.admin?._id === currentUser._id || convo.admin === currentUser._id;

  const handleAddMember = async () => {
    if (!newUsername.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await addGroupMember(convo._id, newUsername.trim());
      onMemberChange(res.data);
      setNewUsername("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      setError(null);
      const res = await removeGroupMember(convo._id, userId);
      onMemberChange(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeave = async () => {
    try {
      setError(null);
      await leaveGroup(convo._id);
      onLeft();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
    }
  };

  const handleDisband = async () => {
    try {
      setError(null);
      await disbandGroup(convo._id);
      onDisbanded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disband group");
    }
  };

  const adminId = convo.admin?._id || convo.admin;

  return (
    <div className="w-60 bg-zinc-900 border-l border-zinc-800 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold truncate">{convo.groupName}</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg">✕</button>
      </div>

      {/* Members list */}
      <div>
        <div className="text-zinc-400 text-xs mb-2 uppercase tracking-wide">
          Members ({convo.participants?.length || 0})
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {convo.participants?.map(p => {
            const participantId = p._id || p;
            const isCurrentUser = participantId.toString() === currentUser._id.toString();
            const isParticipantAdmin = participantId.toString() === adminId?.toString();

            return (
              <div key={participantId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{p.username || "Unknown"}</span>
                  {isParticipantAdmin && (
                    <span className="text-xs text-yellow-400">admin</span>
                  )}
                </div>
                {/* Admin can remove anyone except themselves */}
                {isAdmin && !isCurrentUser && !isParticipantAdmin && (
                  <button
                    onClick={() => handleRemove(participantId)}
                    className="text-red-500 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add member — admin only */}
      {isAdmin && (
        <div className="flex flex-col gap-2">
          <div className="text-zinc-400 text-xs uppercase tracking-wide">Add Member</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddMember()}
              className="flex-1 bg-zinc-700 text-white rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleAddMember}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-red-400 text-xs">{error}</div>}

      {/* Leave / Disband */}
      <div className="mt-auto">
        {isAdmin ? (
          <button
            onClick={handleDisband}
            className="w-full py-2 text-sm rounded bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors"
          >
            Disband Group
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="w-full py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            Leave Group
          </button>
        )}
      </div>
    </div>
  );
}
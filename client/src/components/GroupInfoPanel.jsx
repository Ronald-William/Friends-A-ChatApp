import { useState } from "react";
import { addGroupMember, removeGroupMember, leaveGroup, disbandGroup } from "../services/chatApi";
import { useTheme } from "../context/ThemeContext";

export default function GroupInfoPanel({ convo, currentUser, onClose, onLeft, onDisbanded, onMemberChange }) {
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const { dark } = useTheme();

  if (!convo) return null;

  const isAdmin = convo.admin?._id === currentUser._id || convo.admin === currentUser._id;
  const adminId = convo.admin?._id || convo.admin;
  const d = dark;

  const handleAddMember = async () => {
    if (!newUsername.trim()) return;
    try {
      setLoading(true); setError(null);
      const res = await addGroupMember(convo._id, newUsername.trim());
      onMemberChange(res.data); setNewUsername("");
    } catch (err) { setError(err.response?.data?.message || "Failed to add member"); }
    finally { setLoading(false); }
  };

  const handleRemove = async (userId) => {
    try { setError(null); const res = await removeGroupMember(convo._id, userId); onMemberChange(res.data); }
    catch (err) { setError(err.response?.data?.message || "Failed to remove member"); }
  };

  const handleLeave = async () => {
    try { setError(null); await leaveGroup(convo._id); onLeft(); }
    catch (err) { setError(err.response?.data?.message || "Failed to leave group"); }
  };

  const handleDisband = async () => {
    try { setError(null); await disbandGroup(convo._id); onDisbanded(); }
    catch (err) { setError(err.response?.data?.message || "Failed to disband group"); }
  };

  const panelContent = (
    <>
      <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${d ? "border-dark-border" : "border-light-border"}`}>
        <span className={`font-mono text-[11px] tracking-widest ${d ? "text-dark-muted" : "text-light-muted"}`}>GROUP INFO</span>
        <button onClick={onClose} className={`font-mono text-sm transition-colors ${d ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}>✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <div>
          <div className={`font-display text-xl tracking-wide ${d ? "text-dark-text" : "text-light-text"}`}>{convo.groupName}</div>
          <div className={`font-mono text-[10px] tracking-widest mt-1 ${d ? "text-dark-muted" : "text-light-muted"}`}>{convo.participants?.length || 0} MEMBERS</div>
        </div>

        <div>
          <div className={`font-mono text-[10px] tracking-[0.2em] mb-3 ${d ? "text-dark-muted" : "text-light-muted"}`}>// MEMBERS</div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {convo.participants?.map(p => {
              const participantId = p._id || p;
              const isCurrentUser = participantId.toString() === currentUser._id.toString();
              const isParticipantAdmin = participantId.toString() === adminId?.toString();
              return (
                <div key={participantId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-xs ${d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>
                      {(p.username || "?")[0].toUpperCase()}
                    </div>
                    <span className={`font-mono text-[11px] ${d ? "text-dark-text" : "text-light-text"}`}>{p.username || "Unknown"}</span>
                    {isParticipantAdmin && <span className={`font-mono text-[9px] ${d ? "text-yellow-400" : "text-yellow-600"}`}>★</span>}
                  </div>
                  {isAdmin && !isCurrentUser && !isParticipantAdmin && (
                    <button onClick={() => handleRemove(participantId)} className="font-mono text-[10px] text-red-400 hover:text-red-300 transition-colors">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div>
            <div className={`font-mono text-[10px] tracking-[0.2em] mb-3 ${d ? "text-dark-muted" : "text-light-muted"}`}>// ADD MEMBER</div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="username" value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddMember()}
                className={`flex-1 font-mono text-[11px] px-3 py-2 rounded-lg border outline-none transition-all ${d
                  ? "bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-muted focus:border-dark-accent"
                  : "bg-light-surface border-light-border text-light-text placeholder:text-light-muted focus:border-light-accent"}`}
              />
              <button onClick={handleAddMember} disabled={loading}
                className={`font-mono text-[10px] tracking-wider font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-50 ${d ? "bg-dark-text text-dark-bg" : "bg-light-accent text-light-bg"}`}
              >ADD</button>
            </div>
          </div>
        )}

        {error && (
          <div className={`font-mono text-[10px] px-3 py-2 rounded-lg border ${d ? "border-red-700 text-red-400" : "border-red-300 text-red-500"}`}>{error}</div>
        )}
      </div>

      <div className={`p-4 border-t flex-shrink-0 ${d ? "border-dark-border" : "border-light-border"}`}>
        {isAdmin ? (
          <button onClick={() => setConfirm("disband")} className="w-full font-mono text-[11px] tracking-widest font-bold py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all">DISBAND GROUP</button>
        ) : (
          <button onClick={() => setConfirm("leave")} className={`w-full font-mono text-[11px] tracking-widest py-2.5 rounded-xl border transition-all ${d ? "border-dark-border text-dark-muted hover:border-red-700 hover:text-red-400" : "border-light-border text-light-muted hover:border-red-300 hover:text-red-500"}`}>LEAVE GROUP</button>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className={`w-full max-w-xs rounded-2xl border shadow-2xl overflow-hidden ${d ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}>
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-6">
              <h3 className={`font-display text-xl tracking-wide mb-2 ${d ? "text-dark-text" : "text-light-text"}`}>
                {confirm === "disband" ? "DISBAND GROUP?" : "LEAVE GROUP?"}
              </h3>
              <p className={`font-body text-sm mb-6 ${d ? "text-dark-muted" : "text-light-muted"}`}>
                {confirm === "disband"
                  ? "This will permanently delete the group and remove all members. This cannot be undone."
                  : "You will lose access to this group and its messages."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className={`flex-1 font-mono text-[11px] tracking-widest py-2.5 rounded-xl border transition-all ${d ? "border-dark-border text-dark-muted hover:border-dark-accent" : "border-light-border text-light-muted hover:border-light-accent"}`}
                >CANCEL</button>
                <button
                  onClick={() => { setConfirm(null); confirm === "disband" ? handleDisband() : handleLeave(); }}
                  className="flex-1 font-mono text-[11px] tracking-widest font-bold py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all"
                >{confirm === "disband" ? "DISBAND" : "LEAVE"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile — slide-in overlay */}
      <div className="md:hidden fixed inset-0 z-40">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className={`absolute right-0 top-0 bottom-0 w-72 flex flex-col border-l ${d ? "bg-dark-bg border-dark-border" : "bg-light-bg border-light-border"}`}>
          {panelContent}
        </div>
      </div>
      {/* Desktop — inline */}
      <div className={`hidden md:flex w-56 flex-col border-l ${d ? "bg-dark-bg border-dark-border" : "bg-light-bg border-light-border"}`}>
        {panelContent}
      </div>
    </>
  );
}
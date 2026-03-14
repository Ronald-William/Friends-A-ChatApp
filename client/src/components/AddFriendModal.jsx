import { useState } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function AddFriendModal({ onClose, onRequestSent }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { dark } = useTheme();
  const d = dark;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError("Please enter a username"); return; }
    try {
      setLoading(true); setError(null); setSuccess(false);
      const res = await api.post("/friends/request", { username: username.trim() });
      setSuccess(true);
      if (onRequestSent) onRequestSent(res.data);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send request");
    } finally { setLoading(false); }
  };

  const inputClass = `w-full font-mono text-sm px-4 py-3 rounded-xl border outline-none transition-all ${d
    ? "bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-muted focus:border-dark-accent"
    : "bg-light-surface border-light-border text-light-text placeholder:text-light-muted focus:border-light-accent"}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${d ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}
      >
        <div className={`h-1.5 w-full ${d ? "bg-dark-accent" : "bg-light-accent"}`} />
        <div className="p-6">
          <div className="mb-6">
            <h2 className={`font-brand text-2xl tracking-wide mb-1 ${d ? "text-dark-text" : "text-light-text"}`}>ADD FRIEND</h2>
            
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={`font-mono text-[11px] tracking-widest uppercase mb-2 block ${d ? "text-dark-muted" : "text-light-muted"}`}>Username</label>
              <input
                type="text"
                className={inputClass}
                placeholder="enter their username"
                value={username}
                onChange={e => { setUsername(e.target.value); if (error) setError(null); }}
                autoFocus
                disabled={loading || success}
              />
            </div>

            {error && (
              <div className={`font-mono text-[11px] px-4 py-3 rounded-xl border ${d ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-300 text-red-600"}`}>
                {error}
              </div>
            )}

            {success && (
              <div className={`font-mono text-[11px] px-4 py-3 rounded-xl border ${d ? "bg-green-900/20 border-green-700 text-green-400" : "bg-green-50 border-green-300 text-green-600"}`}>
                ✓ FRIEND REQUEST SENT
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 font-mono text-[11px] tracking-widest py-3 rounded-xl border transition-all ${d ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text" : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}
              >{success ? "CLOSE" : "CANCEL"}</button>
              {!success && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 font-mono text-[11px] tracking-widest font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${d ? "bg-dark-text text-dark-bg hover:shadow-[0_4px_16px_#D2C1B644]" : "bg-light-accent text-light-bg hover:shadow-[0_4px_16px_#D2535344]"}`}
                >{loading ? "SENDING..." : "SEND REQUEST →"}</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
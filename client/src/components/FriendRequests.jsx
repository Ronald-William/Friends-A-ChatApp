import { useEffect, useState } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function FriendRequests({ onRequestHandled }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { dark } = useTheme();
  const d = dark;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/friends/requests");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAccept = async (requesterId) => {
    try {
      setProcessingId(requesterId);
      const res = await api.post(`/friends/accept/${requesterId}`);
      setRequests(prev => prev.filter(r => r._id !== requesterId));
      if (onRequestHandled) onRequestHandled(res.data.conversation);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request");
    } finally { setProcessingId(null); }
  };

  const handleReject = async (requesterId) => {
    try {
      setProcessingId(requesterId);
      await api.post(`/friends/reject/${requesterId}`);
      setRequests(prev => prev.filter(r => r._id !== requesterId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request");
    } finally { setProcessingId(null); }
  };

  if (loading) return (
    <div className={`p-4 font-mono text-[11px] text-center ${d ? "text-dark-muted" : "text-light-muted"}`}>
      loading...
    </div>
  );

  if (requests.length === 0) return (
    <div className={`p-6 font-mono text-[11px] text-center ${d ? "text-dark-muted" : "text-light-muted"}`}>
      no pending requests
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {requests.map(request => (
        <div key={request._id} className={`flex items-center justify-between px-4 py-3 border-b ${d ? "border-dark-border hover:bg-dark-surface2/50" : "border-light-border hover:bg-light-surface2/50"} transition-colors`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 ${d ? "bg-dark-surface2 text-dark-text" : "bg-light-surface2 text-light-text"}`}>
              {(request.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className={`font-mono text-[11px] tracking-wide ${d ? "text-dark-text" : "text-light-text"}`}>{request.username}</div>
              {request.name && <div className={`font-mono text-[9px] ${d ? "text-dark-muted" : "text-light-muted"}`}>{request.name}</div>}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(request._id)}
              disabled={processingId === request._id}
              className={`font-mono text-[10px] tracking-wider font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${d ? "bg-dark-text text-dark-bg" : "bg-light-accent text-light-bg"}`}
            >{processingId === request._id ? "..." : "✓"}</button>
            <button
              onClick={() => handleReject(request._id)}
              disabled={processingId === request._id}
              className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${d ? "border-dark-border text-dark-muted hover:border-red-700 hover:text-red-400" : "border-light-border text-light-muted hover:border-red-300 hover:text-red-500"}`}
            >{processingId === request._id ? "..." : "✕"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
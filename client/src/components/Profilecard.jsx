import { useTheme } from "../context/ThemeContext";

export default function ProfileCard({ user, isOnline, onClose }) {
  const { dark } = useTheme();

  if (!user) return null;

  const initials = (user.name || user.username || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-xs rounded-2xl border overflow-hidden shadow-2xl transition-colors ${dark
          ? "bg-dark-surface border-dark-border"
          : "bg-light-surface border-light-border"}`}
      >
        {/* Top accent strip */}
        <div className={`h-1.5 w-full ${dark ? "bg-dark-accent" : "bg-light-accent"}`} />

        <div className="p-6">
          {/* Avatar + online dot */}
          <div className="relative w-fit mx-auto mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl tracking-wider ${dark
              ? "bg-dark-surface2 text-dark-text border-2 border-dark-border"
              : "bg-light-surface2 text-light-text border-2 border-light-border"}`}>
              {initials}
            </div>
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 ${dark ? "border-dark-surface" : "border-light-surface"} ${isOnline ? "bg-green-500" : "bg-zinc-500"}`} />
          </div>

          {/* Name + username */}
          <div className="text-center mb-6">
            {user.name && user.name !== user.username && (
              <div className={`font-display text-2xl tracking-wide mb-1 ${dark ? "text-dark-text" : "text-light-text"}`}>
                {user.name}
              </div>
            )}
            <div className={`font-mono text-sm tracking-widest ${dark ? "text-dark-muted" : "text-light-muted"}`}>
              @{user.username}
            </div>
          </div>

          {/* Status row */}
          <div className={`flex items-center justify-center gap-2 font-mono text-[11px] tracking-widest mb-6 ${isOnline
            ? "text-green-500"
            : dark ? "text-dark-muted" : "text-light-muted"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-zinc-500"}`} />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>

          {/* Email if available */}
          {user.email && (
            <div className={`font-mono text-[11px] tracking-wider text-center mb-6 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
              {user.email}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className={`w-full font-mono text-[11px] tracking-widest font-bold py-3 rounded-xl border transition-all hover:-translate-y-0.5 ${dark
              ? "border-dark-border text-dark-muted hover:border-dark-accent hover:text-dark-text"
              : "border-light-border text-light-muted hover:border-light-accent hover:text-light-text"}`}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
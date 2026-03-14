import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  

  const { login } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError("Please fill in all fields"); return; }
    try {
      setLoading(true);
      const res = await api.post("/users/login", { email: formData.email, password: formData.password });
      login(res.data);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const d = dark;
  const inputClass = `w-full font-mono text-sm px-4 py-3 rounded-xl border outline-none transition-all ${d
    ? "bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-muted focus:border-dark-accent"
    : "bg-light-surface border-light-border text-light-text placeholder:text-light-muted focus:border-light-accent"}`;
  const labelClass = `font-mono text-[11px] tracking-widest uppercase mb-2 block ${d ? "text-dark-muted" : "text-light-muted"}`;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-500 ${d ? "bg-dark-bg grid-bg-dark" : "bg-light-bg grid-bg-light"}`}>

      <div className="fixed top-4 right-4">
        <button
          onClick={toggleTheme}
          className={`font-mono text-[11px] tracking-widest px-3 py-1.5 rounded-lg border transition-all ${d ? "bg-dark-surface border-dark-border text-dark-text" : "bg-light-surface border-light-border text-light-text"}`}
        >
          {d ? "☀ LIGHT" : "◑ DARK"}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" className={`font-mono text-[11px] tracking-[0.3em] block mb-6 transition-colors ${d ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}>
            ← YAPPER HUB
          </Link>
          <h1 className={`font-brand text-5xl tracking-wide ${d ? "text-dark-text" : "text-light-text"}`}>
            WELCOME BACK.
          </h1>
          <p className={`font-body italic text-lg mt-2 ${d ? "text-dark-muted" : "text-light-muted"}`}>
            "Come on in, the door's open."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Email or Username</label>
            <input type="text" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="your email or username" required />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" required />
          </div>

          {error && (
            <div className={`font-mono text-[11px] px-4 py-3 rounded-xl border ${d ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-50 border-red-300 text-red-600"}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-mono text-sm font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${d
              ? "bg-dark-text text-dark-bg hover:shadow-[0_6px_20px_#D2C1B644]"
              : "bg-light-accent text-light-bg hover:shadow-[0_6px_20px_#D2535344]"}`}
          >
            {loading ? "LOGGING IN..." : "LOG IN →"}
          </button>
        </form>

        <p className={`font-mono text-[11px] tracking-wider text-center mt-8 ${d ? "text-dark-muted" : "text-light-muted"}`}>
          DON'T HAVE AN ACCOUNT?{" "}
          <Link to="/register" className={`font-bold underline underline-offset-4 ${d ? "text-dark-text" : "text-light-accent"}`}>
            SIGN UP
          </Link>
        </p>
      </div>
    </div>
  );
}
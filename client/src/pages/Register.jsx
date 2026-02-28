import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear errors when user types
    if (error) setError("");
    if (passwordErrors.length > 0) setPasswordErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordErrors([]);

    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      
      const res = await api.post("/users/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name || formData.username
      });

      // Login user
      login(res.data);
      
      // Redirect to chat
      navigate("/chat");
      
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle password validation errors from backend
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
        setError(err.response.data.message || "Password does not meet requirements");
      } else {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-zinc-400">Join Yapper Hub today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Choose a username"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Name (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Your name"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Create a strong password"
              required
            />
            
            <PasswordStrengthIndicator 
              password={formData.password}
              showRequirements={true}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Confirm your password"
              required
            />
            
            {/* Password match indicator */}
            {formData.confirmPassword && (
              <div className={`text-xs mt-2 ${
                formData.password === formData.confirmPassword 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {formData.password === formData.confirmPassword 
                  ? '✓ Passwords match' 
                  : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
              <p className="text-red-500 text-sm font-medium">{error}</p>
              {passwordErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordErrors.map((err, index) => (
                    <li key={index} className="text-red-400 text-xs">
                      • {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-zinc-400">Already have an account? </span>
          <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
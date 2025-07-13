import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // 👈 to navigate programmatically

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true } // ⬅️ Important to include cookies
      );

      setUser(res.data.user);
      setMessage("✅ Login successful!");

      // ✅ Navigate to profile using the user's email
      navigate(`/profile/${res.data.user.email}`);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };

  return (
       <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>🔐 Login</h2>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {message && (
        <p className="message">{message}</p>
      )}
    </div>


  );
}

export default Login;

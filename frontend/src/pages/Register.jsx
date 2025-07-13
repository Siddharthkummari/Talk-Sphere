import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/Register.css';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("photo", photo);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Registration Successful:", response.data);
      navigate(`/profile/${email}`);
    } catch (error) {
      console.error("Registration error:", error.response?.data || error);
    }
  };

  return (
   <div className="register-container">
  <form className="register-form" onSubmit={handleSubmit}>
    <input
      type="text"
      placeholder="Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setPhoto(e.target.files[0])}
    />
    <button type="submit" className="register-submit-btn">Register</button>
  </form>

  <button className="register-login-btn" onClick={() => navigate(`/login`)}>
    Login
  </button>
</div>

  );
};

export default Register;

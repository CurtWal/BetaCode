import { useState } from "react";
import {
  useNavigate,
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
} from "react-router-dom";
import "../Register.css";
import Logo from "../assets/MOTG_Revised_Logo.png";
import RequestReset from "./RequestReset";
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_VERCEL}login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();
    //console.log(data);
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", JSON.stringify(data.role));
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      setRole(data.role);
      onLogin();
      navigate("/");
    } else {
      alert(data.error || "LogIn failed");
    }
  };

  return (
    <div>
      <div className="container">
        <div className="form-section">
          <img src={Logo} />
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
          </form>
          <p style={{ marginTop: "10px" }}>
            <Link
              to="/forgot-password"
              style={{ color: "#007bff", textDecoration: "underline" }}
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

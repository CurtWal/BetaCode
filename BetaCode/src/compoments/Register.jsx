import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Register.css";
import Logo from "../assets/MOTG_Revised_Logo.png";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role is "user"
  const [freeHourEnabled, setFreeHourEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkFreeHourStatus(); // Check free hour status
  }, []);

  const checkFreeHourStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/freehour-status`
      );
      setFreeHourEnabled(response.data.freeHourEnabled);
    } catch (error) {
      console.error("Error checking free hour status:", error);
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      alert("Please fill in all fields before registering.");
      return; // Stop function execution if fields are empty
    }
    const res = await fetch(`${import.meta.env.VITE_VERCEL}register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        role,
        freehour: freeHourEnabled ? 1 : 0,
      }),
    });

    const data = await res.json();
    if (res.status === 201) {
      alert("Registration successful! You can now log in.");
      navigate("/login"); // Redirect to login page
    } else {
      alert(data.error || "Registration failed");
    }
  };

  return (
    <div className="container">
      <div className="form-section">
        <img src={Logo} />

        <h2>Register</h2>
        <input
          type="text"
          placeholder="Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button onClick={handleRegister}>Register</button>
      </div>
    </div>
  );
};

export default Register;

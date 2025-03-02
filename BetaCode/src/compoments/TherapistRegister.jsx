import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Register.css";

function TherapistRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("therapist"); // Default role is "user"
  const [licenseId, setLicenseId] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    const res = await fetch("http://localhost:3001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
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
    <div
      style={{
        maxWidth: "400px",
        margin: "auto",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "white",
      }}
    >
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={name}
        onChange={(e) => setUsername(e.target.value)}
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

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default TherapistRegister;

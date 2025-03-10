import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Register.css";
import Logo from "../assets/MOTG_Revised_Logo.png";

function TherapistRegister() {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("therapist"); // Default role is "user"
  const [licenseId, setLicenseId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (
      !username ||
      !email ||
      !password ||
      !licenseId ||
      !phoneNumber ||
      !zipCode
    ) {
      alert("Please fill in all fields before registering.");
      return; // Stop function execution if fields are empty
    }
    const res = await fetch(
      `${import.meta.env.VITE_VERCEL}therapistregister`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
          licenseId,
          phoneNumber,
          zipCode,
        }),
      }
    );

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
        <div>
          <img src={Logo} />
          <p>Looking to sign up as a Therapist. Fill out the form below</p>
        </div>
        <h2>Therapist Register</h2>
        <input
          type="text"
          placeholder="Name"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          type="text"
          placeholder="License ID"
          value={licenseId}
          onChange={(e) => setLicenseId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Zip Code"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
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
    </div>
  );
}

export default TherapistRegister;

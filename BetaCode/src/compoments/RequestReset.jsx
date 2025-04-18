import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Register.css";
import Logo from "../assets/MOTG_Revised_Logo.png";
import { Spinner } from "react-bootstrap";

function RequestReset() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [reseting, setResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setResetting(true);
    const res = await fetch(
      `${import.meta.env.VITE_VERCEL}request-password-reset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setMessage("Password reset link sent! Please check your email.");
      setResetting(false);
    } else{
    setError(data.error || "Something went wrong. Try again.");  
    }
  };

  return (
    <div>
      <div className="container">
        <div className="form-section">
          <img src={Logo} alt="Massage On The Go Logo" />
          <h4>Reset Password</h4>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
            />
            <button type="submit">{reseting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Processing...
                </>
              ) : (
                "Reset Password"
              )}</button>
          </form>
          {message && <p style={{ color: "green" }}>{message}</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default RequestReset;

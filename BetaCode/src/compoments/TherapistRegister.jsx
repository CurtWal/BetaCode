import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Register.css";
import Logo from "../assets/MOTG_Revised_Logo.png";
import Select from "react-select";
import makeAnimated from "react-select/animated";

function TherapistRegister() {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [role, setRole] = useState("therapist"); // Default role is "user"
  const [role, setRole] = useState([]);
  const [licenseId, setLicenseId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const animatedComponents = makeAnimated();

  const options = [
    { value: "therapist", label: "Massage Therapist" },
    { value: "personal", label: "Personal Trainer" },
    { value: "yoga", label: "Yoga Instructor" },
    { value: "group", label: "Group Fitness Instructor" },
    { value: "nutritionist", label: "Nutritionist" },
    { value: "pilates", label: "Pilates Instructor" },
    { value: "stretch", label: "Stretch Therapist" },
    { value: "cpr", label: "CPR Instructor" },
    { value: "meditation", label: "Meditation Coach" },
    { value: "zumba", label: "Zumba Instructor" },
    { value: "wellness", label: "Wellness Coach" },
    { value: "ergonomics", label: "Ergonomics Specialist" },
    { value: "breathwork", label: "Breathwork Coach" },
  ];

  const handleRegister = async () => {
    if (
      !username ||
      !email ||
      !password ||
      !licenseId ||
      !phoneNumber ||
      !zipCode ||
      !address ||
      !role.length
    ) {
      alert("Please fill in all fields before registering.");
      return; // Stop function execution if fields are empty
    }
    const res = await fetch(`${import.meta.env.VITE_VERCEL}therapistregister`, {
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
        address,
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
        <div>
          <img src={Logo} />
          <p>Looking to sign up as a Wellness Worker. Fill out the form below</p>
        </div>
        <h2>Wellness Worker Register</h2>
        <input
          type="text"
          placeholder="Name"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
        <Select
          className="roleSelect"
          closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          name="roles"
          options={options}
          onChange={(selectedOptions) => {
            const values = selectedOptions.map((option) => option.value);
            setRole(values);
            //console.log(role)
          }}
          placeholder="What wellness field(s) are you certified in?"
        />
        <input
          type="checkbox"
          id="option1"
          name="options"
          value="medical"
          style={{height:"15px", margin:"0"}}
          onChange={(e) => {
            const { value, checked } = e.target;
            setRole((prev) => {
              if (checked) {
                // add the role if it's not already included
                return [...prev, value];
              } else {
                // remove the role if unchecked
                return prev.filter((role) => role !== value);
              }
            });
          }}
        />
        <label htmlFor="option1" >
          Are you able to be Available for Medical Massages?
        </label>
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
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
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

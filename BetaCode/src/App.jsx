import { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./compoments/Home";
import Bookings from "./compoments/Bookings";
import MedicalBooking from "./compoments/MedicalBooking";
import PrivateRoute from "./compoments/PrivateRoute";
import Login from "./compoments/Login";
import Users from "./compoments/Users";
import Button from "react-bootstrap/Button";
import Register from "./compoments/Register";
import Modal from "react-bootstrap/Modal";
import SpecialForm from "./compoments/SpecialForm";
import TherapistRegister from "./compoments/TherapistRegister";
import ConfirmBooking from "./compoments/ConfirmBooking";
import RequestReset from "./compoments/RequestReset";
import ResetPassword from "./compoments/ResetPassword";
import MedicalForm from "./compoments/MedicalForm";
import SoapNotes from "./compoments/SoapNotes";
import UserProfiles from "./compoments/UserProfiles";
import ConfirmMedicalBooking from "./compoments/confirmMedicalBooking";

import { jwtDecode } from "jwt-decode";
import axios from "axios";
function Layout() {
window.onscroll = () => {
    let header = document.querySelector(".header");
    header.classList.toggle("sticky", window.scrollY > 100);
  };


  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showModal, setShowModal] = useState(false);
  const [freeHourEnabled, setFreeHourEnabled] = useState(true);

  const userRoles = [
    "therapist",
    "group",
    "nutritionist",
    "pilates",
    "stretch",
    "cpr",
    "meditation",
    "zumba",
    "wellness",
    "ergonomics",
    "breathwork",
  ];

  const checkFreeHourStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/freehour-status`
      );
      const isFreeHourEnabled = response.data.freeHourEnabled;
      setFreeHourEnabled(isFreeHourEnabled);

      // Only show modal if free hour is enabled and user is not logged in
      if (!isFreeHourEnabled && !isLoggedIn) {
        setShowModal(false); // Hide modal if free hour is disabled
      } else if (isFreeHourEnabled && !isLoggedIn) {
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 3000);
        // Clear timeout if component unmounts
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error checking free hour status:", error);
    }
  };

  useEffect(() => {
    checkFreeHourStatus(); // Check free hour status
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setIsLoggedIn(false); // Update state after logout
    window.location.href = "/login";
  };

  const closeModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (location.pathname === "/bookings") {
      document.body.style.backgroundColor = "#060141";
    } else {
      document.body.style.backgroundColor = "#1470AF";
    }

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [location.pathname, isLoggedIn]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const { exp } = jwtDecode(token); // Extract the expiration time
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

      // Calculate time until token expires
      const timeUntilExpiry = (exp - currentTime) * 1000;

      if (timeUntilExpiry > 0) {
        setTimeout(() => {
          alert("Session expired. Please log in again.");
          logout(); // Call your logout function
          window.location.href = "/login"; // Redirect to login page
        }, timeUntilExpiry);
      } else {
        // If token is already expired, logout immediately
        logout();
      }
    }
  }, []);
  const hasRole = (targetRoles) => {
    try {
      const role = JSON.parse(localStorage.getItem("role") || "[]");
      const userRoles = Array.isArray(role) ? role : [role];
      return userRoles.some((r) => targetRoles.includes(r));
    } catch (e) {
      return false;
    }
  };
  function hasAdminRole(roleName) {
    try {
      const role = JSON.parse(localStorage.getItem("role") || "[]");
      return Array.isArray(role) ? role.includes(roleName) : role === roleName;
    } catch (e) {
      return false;
    }
  }
  return (
    <>
      <div>
        <header class="header">
          
          <nav class="navbar">
            <h4>MOTG Wellbeing</h4>
            <Link to="/" className="!text-black hover:!text-red-500">
              Home
            </Link>

            {hasAdminRole("admin") && (
              <>
                <Link
                  to="/bookings"
                  className="!text-black hover:!text-red-500"
                >
                  Bookings
                </Link>
                <Link
                  to="/medical-bookings"
                  className="!text-black hover:!text-red-500"
                >
                  Medical Bookings
                </Link>
                <Link to="/users" className="!text-black hover:!text-red-500">
                  Users
                </Link>
                <Link
                  to={import.meta.env.VITE_SPREADSHEET}
                  target="_blank"
                  className="!text-black hover:!text-red-500"
                >
                  SpreadSheet
                </Link>
              </>
            )}
            {hasRole(userRoles) && (
              <>
              <Link to="/bookings" className="!text-black hover:!text-red-500">
                Bookings
              </Link>
              <Link
                  to="/medical-bookings"
                  className="!text-black hover:!text-red-500"
                >
                  Medical Bookings
                </Link>
                </>
            )}

            {!isLoggedIn && (
              <>
                <Modal show={showModal} onHide={closeModal} animation={false}>
                  <Modal.Body>
                    <h3 class="!text-black">
                      Register now to get your first hour for free
                    </h3>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onClick={closeModal}>
                      close
                    </Button>
                  </Modal.Footer>
                </Modal>
                <Link
                  to="/register"
                  className="!text-black hover:!text-red-500"
                >
                  Register
                </Link>
                <Link
                  to="/therapistregister"
                  className="!text-black hover:!text-red-500"
                >
                  Wellness Worker Register
                </Link>
                <Link to="/login" className="!text-black hover:!text-red-500">
                  LogIn
                </Link>
              </>
            )}
            {isLoggedIn && (
              <div style={{display:"inline-flex"}}>
                <Link to="/account" className="!text-black hover:!text-red-500">
                Account
              </Link>
              <p
                onClick={logout}
                className="!text-black hover:!text-red-500 cursor-pointer font-semibold w-15"
              >
                Logout
              </p>
              
              </div>
            )}
          </nav>
        </header>
      </div>
      <div className="Main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/users"
            element={
              <PrivateRoute element={<Users />} allowedRoles={["admin"]} />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/login"
            element={<Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route
            path="/account"
            element={<UserProfiles />}
          />
          <Route
            path="/bookings"
            element={
              <PrivateRoute
                element={<Bookings />}
                allowedRoles={[
                  "admin",
                  "therapist",
                  "group",
                  "nutritionist",
                  "pilates",
                  "stretch",
                  "cpr",
                  "meditation",
                  "zumba",
                  "wellness",
                  "ergonomics",
                  "breathwork",
                ]}
              />
            }
          />
          <Route
            path="/medical-bookings"
            element={
              <PrivateRoute
                element={<MedicalBooking />}
                allowedRoles={[
                  "admin",
                  "therapist",
                  "group",
                  "nutritionist",
                  "pilates",
                  "stretch",
                  "cpr",
                  "meditation",
                  "zumba",
                  "wellness",
                  "ergonomics",
                  "breathwork",
                ]}
              />
            }
          />
          <Route path="/special-form" element={<SpecialForm />} />
          <Route path="/therapistregister" element={<TherapistRegister />} />
          <Route path="/confirm-booking/:id" element={<ConfirmBooking />} />
          <Route path="/confirm-medicalbooking/:id" element={<ConfirmMedicalBooking />} />
          <Route path="/forgot-password" element={<RequestReset />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/medical-form" element={<MedicalForm />} />
          <Route path="/soapnotes/:bookingId/:therapistId" element={<SoapNotes />} />
        </Routes>
      </div>
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;

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
import PrivateRoute from "./compoments/PrivateRoute";
import Login from "./compoments/Login";
import Users from "./compoments/Users";
import Button from "react-bootstrap/Button";
import Register from "./compoments/Register";
import Modal from "react-bootstrap/Modal";
import SpecialForm from "./compoments/SpecialForm";
import TherapistRegister from "./compoments/TherapistRegister";
import ConfirmBooking from "./compoments/ConfirmBooking";

import { jwtDecode } from "jwt-decode";
import axios from "axios";
function Layout() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showModal, setShowModal] = useState(false);
  const [freeHourEnabled, setFreeHourEnabled] = useState(true);

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
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/" className="!text-white hover:!text-red-500">
              Home
            </Link>
          </li>

          {localStorage.getItem("role") === "admin" && (
            <div>
              <li>
                <Link
                  to="/bookings"
                  className="!text-white hover:!text-red-500"
                >
                  Bookings
                </Link>
              </li>
              <li>
                <Link to="/users" className="!text-white hover:!text-red-500">
                  Users
                </Link>
              </li>
            </div>
          )}
          {localStorage.getItem("role") === "therapist" && (
            <li>
              <Link to="/bookings" className="!text-white hover:!text-red-500">
                Bookings
              </Link>
            </li>
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
              <li>
                <Link
                  to="/register"
                  className="!text-white hover:!text-red-500"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/therapistregister"
                  className="!text-white hover:!text-red-500"
                >
                  Therapist Register
                </Link>
              </li>
              <li>
                <Link to="/login" className="!text-white hover:!text-red-500">
                  LogIn
                </Link>
              </li>
            </>
          )}
          {isLoggedIn && (
            <li>
              <p
                onClick={logout}
                className="!text-white hover:!text-red-500 cursor-pointer font-semibold w-15"
              >
                Logout
              </p>
            </li>
          )}
        </ul>
      </nav>
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
          path="/bookings"
          element={
            <PrivateRoute
              element={<Bookings />}
              allowedRoles={["admin", "therapist"]}
            />
          }
        />
        <Route path="/special-form" element={<SpecialForm />} />
        <Route path="/therapistregister" element={<TherapistRegister />} />
        <Route path="/confirm-booking/:id" element={<ConfirmBooking />} />
      </Routes>
    </div>
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

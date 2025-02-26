import { useState, useEffect } from "react";
import "./App.css";
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
// import FormData from './compoments/FormData'
// import TimeTracker from './compoments/TimeTacker'
// import ReportForm from './compoments/ReportForm'
// import Sorts from './compoments/Sorts'

function Layout() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false); // Update state after logout
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

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/" className="!text-white hover:!text-red-500">
              Home
            </Link>
          </li>
          
          {localStorage.getItem("role") === "admin"&&(
            <div>
            <li>
            <Link to="/bookings" className="!text-white hover:!text-red-500">
              Bookings
            </Link>
          </li><
            li>
            <Link to="/users" className="!text-white hover:!text-red-500">
              Users
            </Link>
          </li>
          </div>
          )}
          {localStorage.getItem("role") === "therapist"&&(
            <li>
            <Link to="/bookings" className="!text-white hover:!text-red-500">
              Bookings
            </Link>
          </li>
        
          )}
          
          {!isLoggedIn && (
            <>
              <li>
                <Link to="/register" className="!text-white hover:!text-red-500">
                  Register
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
              <p onClick={logout} className="!text-white hover:!text-red-500 cursor-pointer font-semibold w-15">
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
          element={<PrivateRoute element={<Users />} allowedRoles={["admin"]} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route
          path="/bookings"
          element={<PrivateRoute element={<Bookings />} allowedRoles={["admin", "therapist"]} />}
        />
        
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

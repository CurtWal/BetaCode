import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation  } from "react-router-dom";
import Home from './compoments/Home';
import Bookings from './compoments/Bookings';
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import axios from 'axios';
import Modal from "react-bootstrap/Modal";

// import FormData from './compoments/FormData'
// import TimeTracker from './compoments/TimeTacker'
// import ReportForm from './compoments/ReportForm'
// import Sorts from './compoments/Sorts'

function Layout(){ 
   const location = useLocation();
   useEffect(() => {
    // Change background color based on route
    if (location.pathname === "/bookings") {
      document.body.style.backgroundColor = "#060141";
    } else {
      document.body.style.backgroundColor = "#1470AF";
    }

    return () => {
      // Cleanup to prevent issues when component unmounts
      document.body.style.backgroundColor = "";
    };
  }, [location.pathname]); 
  return(
    <div>
      <nav >
        <ul >
          <li>
            <Link to="/" className="!text-white hover:!text-red-500">Home</Link>
          </li>
          <li>
            <Link to="/bookings" className="!text-white hover:!text-red-500">Bookings</Link>
          </li>
        </ul>
      </nav>
    <Routes>
      
    <Route path="/" element={<Home/>}/>
    <Route path="bookings" element={<Bookings />} />
    </Routes>
    </div>
  );
}
function App() {

  return (
    <BrowserRouter>
    <Layout/>
    </BrowserRouter>
  );
}

export default App;

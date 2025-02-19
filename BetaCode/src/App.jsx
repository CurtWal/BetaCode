import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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
function App() {

  return (
    <BrowserRouter>
    <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/bookings">Bookings</Link>
          </li>
        </ul>
      </nav>
    <Routes>
    <Route path="/" element={<Home/>}/>
    
    <Route path="bookings" element={<Bookings />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;

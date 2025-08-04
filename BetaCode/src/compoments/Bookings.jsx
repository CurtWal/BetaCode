import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../App.css";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import InputGroup from "react-bootstrap/InputGroup";
import Select from "react-select";
import makeAnimated from "react-select/animated";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [therapistInputs, setTherapistInputs] = useState({}); // Stores input per booking
  const [isFull, setIsFull] = useState(false);
  const currentUserId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");
  const [deleteSelectedBooking, setDeleteSelectedBooking] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [joiningBookingId, setJoiningBookingId] = useState(null);
  const [sortOption, setSortOption] = useState("filter");

  const [editBooking, setEditBooking] = useState(null);
  const [validated, setValidated] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [therapist, setTherapist] = useState(1);
  const [eventHours, setEventHours] = useState("2");
  const [eventIncrement, setEventIncrement] = useState("10");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extra, setExtra] = useState("");
  const [price, setPrice] = useState(0);
  const [formType, setFormType] = useState("");
  const [specialPrice, setSpecialPrice] = useState(90);
  const [regularPrice, setRegularPrice] = useState(150);
  const [formRoles, setFormRoles] = useState([]);

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

  const checkLocationDistance = (lat1, lon1, lat2, lon2, maxMiles) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= maxMiles;
  };

  const convertTo12Hour = (time) => {
    if (!time) return ""; // Handle empty or undefined values
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const getBookingPrices = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/booking-prices`
      );
      setRegularPrice(response.data.regularBooking);
      setSpecialPrice(response.data.specialBooking);
    } catch (error) {
      console.error("Error fetching booking prices:", error);
    }
  };

  useEffect(() => {
    getBookingPrices();
  }, []);

  useEffect(() => {
    if (formType == "regular" && eventHours) {
      const hours = parseFloat(eventHours); // Convert to a number
      const wholeHours = Math.floor(hours); // Full hours
      const isHalfHour = hours % 1 !== 0; // Check if there's a half-hour

      const basePrice = therapist * regularPrice * wholeHours; // Price for full hours
      const halfHourPrice = isHalfHour ? therapist * (regularPrice * 0.5) : 0; // Half-hour price

      setPrice(basePrice + halfHourPrice);
    } else if (formType == "special" && eventHours) {
      const hours = parseFloat(eventHours); // Convert to a number
      const wholeHours = Math.floor(hours); // Full hours
      const isHalfHour = hours % 1 !== 0; // Check if there's a half-hour

      const basePrice = therapist * specialPrice * wholeHours; // Price for full hours
      const halfHourPrice = isHalfHour ? therapist * (specialPrice * 0.5) : 0; // Half-hour price

      setPrice(basePrice + halfHourPrice);
    }
  }, [therapist, eventHours, regularPrice, specialPrice]);
  const sortBookings = (bookingsList, option) => {
    const sorted = [...bookingsList];
    switch (option) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case "oldest":
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case "mostHours":
        return sorted.sort(
          (a, b) => parseFloat(b.eventHours) - parseFloat(a.eventHours)
        );
      case "leastHours":
        return sorted.sort(
          (a, b) => parseFloat(a.eventHours) - parseFloat(b.eventHours)
        );
      case "notFilled":
        return sorted.sort((a, b) => {
          const aFilled = (a.assignedTherapists?.length || 0) >= a.therapist;
          const bFilled = (b.assignedTherapists?.length || 0) >= b.therapist;

          // Unfilled bookings should come before filled ones
          if (aFilled === bFilled) return 0;
          return aFilled ? 1 : -1;
        });
      default:
        return sorted;
    }
  };

  function hasRole(roleName) {
    try {
      const role = JSON.parse(localStorage.getItem("role") || "[]");
      return Array.isArray(role) ? role.includes(roleName) : role === roleName;
    } catch (e) {
      return false;
    }
  }

  const getBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("role"); // Assuming role is stored in localStorage
      let userRoles = [];

      try {
        const parsed = JSON.parse(userRole);
        userRoles = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        userRoles = userRole ? [userRole] : [];
      }

      // Fetch all bookings
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const formattedBookings = response.data.map((booking) => ({
        ...booking,
        startTime: convertTo12Hour(booking.startTime),
        endTime: convertTo12Hour(booking.endTime),
      }));

      if (userRole.includes("admin")) {
        // Admin sees all bookings
        setBookings(formattedBookings);
        return;
      }

      // For non-admin users, filter bookings by role match OR assignment availability

      const filtered = formattedBookings.filter((booking) => {
        // Ensure bookingRoles is always an array
        const bookingRoles = Array.isArray(booking.formRoles)
          ? booking.formRoles
          : typeof booking.formRoles === "string"
          ? [booking.formRoles]
          : [];

        // Ensure userRoles is always an array
        const normalizedUserRoles = Array.isArray(userRoles)
          ? userRoles
          : typeof userRoles === "string"
          ? [userRoles]
          : [];

        const hasMatchingRole = bookingRoles.some((role) =>
          normalizedUserRoles.includes(role)
        );

        const totalSlots = booking.therapist ?? 1;

        const isTherapistAssigned =
          Array.isArray(booking.assignedTherapists) &&
          booking.assignedTherapists.some((t) => t?._id === userId);

        const isNotFull = booking.assignedTherapists.length < totalSlots;

        // Show booking if user has matching role and it's not full,
        // or if user is assigned even if full
        return (hasMatchingRole && isNotFull) || isTherapistAssigned;
      });

      const sorted = sortBookings(filtered, sortOption);
      setBookings(sorted);
      //console.log(filtered)
      return;
      //}
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error);
    }
  };

  useEffect(() => {
    setBookings((prev) => sortBookings(prev, sortOption));
  }, [sortOption]);

  const formatEventHours = (hours) => {
    const num = parseFloat(hours);
    const wholeHours = Math.floor(num);
    const minutes = num % 1 !== 0 ? 30 : 0;
    return `${wholeHours} Hour${wholeHours !== 1 ? "s" : ""}${
      minutes ? ` ${minutes} Minutes` : ""
    }`;
  };

  const joinBooking = async (bookingId) => {
    if (joiningBookingId === bookingId) return; // Prevent rapid double-clicks

    setJoiningBookingId(bookingId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const therapistId = localStorage.getItem("userId");
      const therapistName = localStorage.getItem("username");

      const newBooking = bookings.find((b) => b._id === bookingId);
      const newDate = newBooking.date;
      const newStartTime = newBooking.startTime;
      const newEndTime = newBooking.endTime;

      // Convert 12-hour to 24-hour for comparison
      const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const newStart = parseTime(newStartTime);
      const newEnd = parseTime(newEndTime);

      // Check for time conflicts with other assigned bookings
      const conflictingBooking = bookings.find((b) => {
        if (
          b._id !== bookingId &&
          b.date === newDate &&
          b.assignedTherapists?.some((t) => t._id === therapistId)
        ) {
          const existingStart = parseTime(b.startTime);
          const existingEnd = parseTime(b.endTime);

          // Block if:
          // 1. Overlaps
          // 2. Not enough 1-hour gap between jobs
          const BUFFER_MINUTES = 60; // 1-hour gap required

          const overlap = newStart < existingEnd && existingStart < newEnd;

          // Not enough buffer after previous booking
          const endsTooCloseToNext = newStart < existingEnd + BUFFER_MINUTES;

          // Not enough buffer before next booking
          const startsTooCloseToPrev = existingStart < newEnd + BUFFER_MINUTES;

          return overlap || endsTooCloseToNext || startsTooCloseToPrev;
        }
        return false;
      });

      if (conflictingBooking) {
        alert(
          `You are already assigned to a booking that overlaps in time on ${newDate}. Please leave that booking first.`
        );
        setJoiningBookingId(null);
        return;
      }

      // Optimistic UI update
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId &&
          !booking.assignedTherapists?.some((t) => t._id === therapistId) // prevent duplicate in UI
            ? {
                ...booking,
                assignedTherapists: [
                  ...(booking.assignedTherapists || []),
                  { _id: therapistId, username: therapistName },
                ],
              }
            : booking
        )
      );

      // Backend assignment
      await axios.post(
        `${import.meta.env.VITE_VERCEL}assign-therapist`,
        { bookingId, therapistId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Check for full booking
      const bookingResponse = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = bookingResponse.data;
      const assignedCount = booking.assignedTherapists.length;
      const remainingSpots = booking.therapist - assignedCount;
      //console.log(booking);
      //console.log(currentUserId);
      if (remainingSpots === 0) {
        await axios.post(
          `${import.meta.env.VITE_VERCEL}send-email-on-spot-fill`,
          { bookingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFull(true);
        //console.log("All Spots filled sending email");
      }

      getBookings(); // refresh UI
    } catch (error) {
      console.error("Error joining booking:", error.response?.data || error);
    } finally {
      setJoiningBookingId(null);
    }
  };

  const markComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_VERCEL}bookings/${id}`,
        {
          isComplete: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure "Bearer" is present
          },
        }
      );

      setBookings(
        bookings.map((booking) =>
          booking._id === id ? { ...booking, isComplete: true } : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking:", error.response?.data || error);
    }
  };

  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  const handleShow = (bookingId) => {
    setSelectedBooking(bookingId);
    // Ensure there are inputs for this booking, or set empty defaults
    setTherapistInputs((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId] || { input1: "", input2: "", input3: "" },
    }));
  };

  const handleClose = () => {
    setSelectedBooking(null);
  };
  const setThisDeletedBooking = (bookingId) => {
    setDeleteSelectedBooking(bookingId);
  };
  const setCloseDeletedBooking = (bookingId) => {
    setDeleteSelectedBooking(bookingId);
  };
  const leaveBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const therapistId = localStorage.getItem("userId");

      // Update UI immediately
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                assignedTherapists: booking.assignedTherapists.filter(
                  (therapist) => therapist._id !== therapistId
                ),
              }
            : booking
        )
      );

      // Send API request to remove therapist
      await axios.post(
        `${import.meta.env.VITE_VERCEL}leave-booking`,
        { bookingId, therapistId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      getBookings();
    } catch (error) {
      console.error("Error leaving booking:", error.response?.data || error);
    }
  };

  const removeTherapistFromBooking = async (bookingId, therapistIdToRemove) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      // Update UI immediately
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                assignedTherapists: booking.assignedTherapists.filter(
                  (therapist) => therapist._id !== therapistIdToRemove
                ),
              }
            : booking
        )
      );

      // Backend call to remove the therapist
      await axios.post(
        `${import.meta.env.VITE_VERCEL}admin-remove-therapist`,
        { bookingId, therapistId: therapistIdToRemove },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      getBookings(); // Refresh bookings
    } catch (error) {
      console.error("Error removing therapist:", error.response?.data || error);
    }
  };

  const deleteBooking = async (bookingId, type) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${
          import.meta.env.VITE_VERCEL
        }delete/bookings/${bookingId}?type=${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
      setDeleteSelectedBooking(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const exportToGoogleSheet = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_VERCEL}api/export-bookings`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Bookings exported to Google Sheets!");
      if (
        window.confirm(
          'If you click "ok" you would be redirected To SpreadSheet. Cancel will load this website '
        )
      ) {
        window.location.href =
          "https://docs.google.com/spreadsheets/d/1SZ_8iRJTdS0dz5iwMOWHV6wnPBO0d0skE7gSSEcQdoc/edit?gid=0#gid=0";
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export bookings.");
    }
  };
  const handleEditModal = async (id) => {
    setEditBooking(id);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings/${id}`
      );
      const data = res.data;
      setCompanyName(data.companyName || "");
      setName(data.name || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setZipCode(data.zipCode || "");
      setTherapist(data.therapist || 1);
      setEventHours(data.eventHours || "2");
      setEventIncrement(data.eventIncrement || "10");
      setDate(data.date?.split("T")[0] || "");
      setStartTime(data.startTime || "");
      setEndTime(data.endTime || "");
      setExtra(data.extra || "");
      setPrice(data.price || 0);
      setFormType(data.formType || "");
      setFormRoles(data.formRoles || []);
    } catch (err) {
      console.error("Failed to fetch booking", err);
    }
  };
  const handleCloseEditModal = () => setEditBooking(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }
    setValidated(true);
    if (form.checkValidity() === true) {
      try {
        const id = editBooking;
        //console.log(id);
        await axios.put(`${import.meta.env.VITE_VERCEL}bookings/${id}`, {
          companyName,
          name,
          email,
          address,
          zipCode,
          therapist,
          eventHours,
          eventIncrement,
          date,
          startTime,
          endTime,
          extra,
          price,
          formType,
          formRoles,
        });
        alert("Booking updated!");
      } catch (err) {
        console.error("Error updating booking", err);
        alert("Error updating booking");
      }
    }
  };
  useEffect(() => {
    getBookings(); // Initial fetch
  }, [handleSubmit]);

  return (
    <div class="bookContentSize">
      <div>
        {hasRole("admin") && (
          <div style={{ marginTop: "60px" }}>
            <button onClick={exportToGoogleSheet}>
              Export to Google Sheet
            </button>
          </div>
        )}

        <div className="bookingContainer">
          <h1 style={{ textAlign: "center" }}>Bookings</h1>

          <div className="bookings-controls">
            {hasRole("admin") && (
              <label>
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={toggleShowCompleted}
                />
                Show Completed Bookings
              </label>
            )}
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="sortSelect">Sort by: </label>
              <select
                id="sortSelect"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="filter">Filter</option>
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest</option>
                <option value="mostHours">Most Hours</option>
                <option value="leastHours">Least Hours</option>
                <option value="notFilled">Still Available</option>
              </select>
            </div>
          </div>
          <div className="">
            <ul className="bookings">
              {bookings.map((booking) =>
                !booking.isComplete || showCompleted ? (
                  <li key={booking._id}>
                    <div className="booking-card">
                      <li>Company Name: {booking.companyName}</li>
                      <li>Name: {booking.name}</li>
                      <li>Email: {booking.email}</li>
                      <li>Address: {booking.address}</li>
                      <li>ZipCode: {booking.zipCode}</li>
                      <li># of Therapist: {booking.therapist}</li>
                      <li>
                        EventHours: {formatEventHours(booking.eventHours)}
                      </li>
                      <li>EventIncrements: {booking.eventIncrement} Minutes</li>
                      <li>Available Date: {booking.date}</li>
                      <li>Start Time: {booking.startTime}</li>
                      <li>End Time: {booking.endTime}</li>
                      {booking.documentUrl && (
                        <li>
                          <a
                            href={booking.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Medical Docs
                          </a>
                        </li>
                      )}
                      <li>Extra Info: {booking.extra}</li>

                      <div className="button-container">
                        <Button onClick={() => handleShow(booking._id)}>
                          {booking.assignedTherapists.some(
                            (t) => t._id === currentUserId
                          )
                            ? "You Joined"
                            : booking.assignedTherapists.length <
                              booking.therapist
                            ? "Assign Therapist"
                            : "Job Filled"}
                        </Button>

                        {/* {!booking.isComplete && (
                        <Button
                          onClick={() => markComplete(booking._id)}
                          style={{ marginLeft: "10px" }}
                          variant="danger"
                        >
                          Mark Job Complete
                        </Button>
                      )} */}
                        {hasRole("admin") && (
                          // <Button onClick={() => deleteBooking(booking._id)} variant="danger">
                          //   Delete Booking
                          // </Button>

                          <Button
                            onClick={() => handleEditModal(booking._id)}
                            variant="danger"
                            style={{ overflow: "clip" }}
                          >
                            Edit Booking
                          </Button>
                        )}
                        <div>
                          {editBooking === booking._id && (
                            <Modal show onHide={handleCloseEditModal}>
                              <Modal.Header closeButton>
                                <h3 style={{ color: "black" }}>Edit Booking</h3>
                              </Modal.Header>
                              <Modal.Body>
                                <div className="FormInput">
                                  <Form noValidate validated={validated}>
                                    <Row className="mb-3">
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom01"
                                      >
                                        <Form.Label>Company Name</Form.Label>
                                        <Form.Control
                                          required
                                          type="text"
                                          placeholder="Company Name"
                                          value={companyName}
                                          onChange={(e) =>
                                            setCompanyName(e.target.value)
                                          }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Company Name.
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback>
                                          Looks good!
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom01"
                                      >
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                          required
                                          type="text"
                                          placeholder="Name"
                                          value={name}
                                          onChange={(e) =>
                                            setName(e.target.value)
                                          }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Name.
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback>
                                          Looks good!
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom02"
                                      >
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                          required
                                          type="text"
                                          placeholder="Email"
                                          value={email}
                                          onChange={(e) =>
                                            setEmail(e.target.value)
                                          }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Email.
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback>
                                          Looks good!
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                    </Row>
                                    <Row className="mb-3">
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom03"
                                      >
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                          required
                                          type="text"
                                          placeholder="Address"
                                          value={address}
                                          onChange={(e) =>
                                            setAddress(e.target.value)
                                          }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Address.
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback>
                                          Looks good!
                                        </Form.Control.Feedback>
                                      </Form.Group>

                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom04"
                                      >
                                        <Form.Label>ZipCode</Form.Label>
                                        <Form.Control
                                          type="text"
                                          placeholder="ZipCode"
                                          value={zipCode}
                                          onChange={(e) =>
                                            setZipCode(e.target.value)
                                          }
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid ZipCode.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom05"
                                      >
                                        <Form.Label># of Therapist</Form.Label>
                                        <Form.Control
                                          type="number"
                                          placeholder="Number of Therapist"
                                          value={therapist}
                                          onChange={(e) =>
                                            setTherapist(e.target.value)
                                          }
                                          min="1"
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Therapist
                                          Number.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                    </Row>
                                    <Row className="mb-3">
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom06"
                                      >
                                        <Form.Label>Event Hours</Form.Label>
                                        <Form.Select
                                          value={eventHours}
                                          onChange={(e) =>
                                            setEventHours(e.target.value)
                                          }
                                          required
                                        >
                                          <option value="2">2 Hours</option>
                                          <option value="2.5">
                                            2 Hours 30 Minutes
                                          </option>
                                          <option value="3">3 Hours</option>
                                          <option value="3.5">
                                            3 Hours 30 Minutes
                                          </option>
                                          <option value="4">4 Hours</option>
                                          <option value="4.5">
                                            4 Hours 30 Minutes
                                          </option>
                                          <option value="5">5 Hours</option>
                                          <option value="5.5">
                                            5 Hours 30 Minutes
                                          </option>
                                          <option value="6">6 Hours</option>
                                          <option value="6.5">
                                            6 Hours 30 Minutes
                                          </option>
                                          <option value="7">
                                            7 Hours 30 Minutes
                                          </option>
                                          <option value="7.5">
                                            7 Hours 30 Minutes
                                          </option>
                                          <option value="8">8 Hours</option>
                                          <option value="8.5">
                                            8 Hours 30 Minutes
                                          </option>
                                          <option value="9">9 Hours</option>
                                          <option value="9.5">9 Hours</option>
                                          <option value="10">10 Hours</option>
                                          <option value="10.5">
                                            10 Hours 30 Minutes
                                          </option>
                                          <option value="11">11 Hours</option>
                                          <option value="11.5">
                                            11 Hours 30 Minutes
                                          </option>
                                          <option value="12">12 Hours</option>
                                          <option value="12.5">
                                            12 Hours 30 Minutes
                                          </option>
                                        </Form.Select>
                                      </Form.Group>

                                      <Form.Group
                                        xs={12}
                                        md={4}
                                        as={Col}
                                        controlId="validationCustom07"
                                      >
                                        <Form.Label>
                                          Massage Increments
                                        </Form.Label>
                                        <Form.Select
                                          value={eventIncrement}
                                          onChange={(e) =>
                                            setEventIncrement(e.target.value)
                                          }
                                          required
                                        >
                                          <option value="10">10 Minutes</option>
                                          <option value="15">15 Minutes</option>
                                          <option value="20">20 Minutes</option>
                                        </Form.Select>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom05"
                                      >
                                        <Form.Label>Availiable Date</Form.Label>
                                        <Form.Control
                                          type="Date"
                                          placeholder="Date"
                                          value={date}
                                          onChange={(e) =>
                                            setDate(e.target.value)
                                          }
                                          min="1"
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid date.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom05"
                                      >
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control
                                          type="time"
                                          placeholder="Time"
                                          value={startTime}
                                          onChange={(e) =>
                                            setStartTime(e.target.value)
                                          }
                                          min="1"
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid Start Time.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <Form.Group
                                        as={Col}
                                        xs={12}
                                        md={4}
                                        controlId="validationCustom05"
                                      >
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control
                                          type="time"
                                          placeholder="Time"
                                          value={endTime}
                                          onChange={(e) =>
                                            setEndTime(e.target.value)
                                          }
                                          min="1"
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Please provide a valid End Time.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                      <InputGroup>
                                        <InputGroup.Text>
                                          Anything else?
                                        </InputGroup.Text>
                                        <Form.Control
                                          as="textarea"
                                          aria-label="With textarea"
                                          value={extra}
                                          onChange={(e) => {
                                            setExtra(e.target.value);
                                            //console.log(extra);
                                          }}
                                        />
                                      </InputGroup>
                                      <Form.Group
                                        as={Col}
                                        controlId="validationCustom07"
                                        style={{ marginTop: "6%" }}
                                      >
                                        <p>Total: ${price}</p>
                                      </Form.Group>
                                    </Row>
                                    <Row>
                                      <Form.Group as={Col}>
                                        <Button onClick={handleSubmit}>
                                          Update Booking
                                        </Button>
                                      </Form.Group>
                                    </Row>
                                  </Form>
                                </div>
                              </Modal.Body>
                              <Modal.Footer></Modal.Footer>
                            </Modal>
                          )}
                        </div>
                        {hasRole("admin") && (
                          // <Button onClick={() => deleteBooking(booking._id)} variant="danger">
                          //   Delete Booking
                          // </Button>

                          <Button
                            onClick={() => setThisDeletedBooking(booking._id)}
                            variant="danger"
                            style={{ overflow: "clip" }}
                          >
                            Delete / Cancel Booking
                          </Button>
                        )}
                      </div>
                      {/* Show modal only for the selected booking */}
                      {selectedBooking === booking._id && (
                        <Modal show onHide={handleClose}>
                          <Modal.Header closeButton>
                            <h3>Therapist Names</h3>
                          </Modal.Header>
                          <Modal.Body>
                            <div className="input-container">
                              <ul style={{ textAlign: "center" }}>
                                Assigned Therapists:{" "}
                                {booking.assignedTherapists &&
                                booking.assignedTherapists.length > 0 ? (
                                  booking.assignedTherapists.map(
                                    (therapist) => (
                                      <li key={therapist._id}>
                                        {therapist.username
                                          ? therapist.username
                                          : "Unknown"}
                                        {hasRole("admin") && (
                                          <button
                                            onClick={() =>
                                              removeTherapistFromBooking(
                                                booking._id,
                                                therapist._id
                                              )
                                            }
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </li>
                                    )
                                  )
                                ) : (
                                  <span>No therapists assigned yet</span>
                                )}
                              </ul>
                            </div>
                          </Modal.Body>
                          <Modal.Footer>
                            {booking.assignedTherapists.length <
                              booking.therapist && (
                              <Button
                                onClick={() => joinBooking(booking._id)}
                                disabled={
                                  currentUserId &&
                                  booking.assignedTherapists?.some(
                                    (t) => t._id === currentUserId
                                  )
                                }
                              >
                                Join Booking
                              </Button>
                            )}
                            {currentUserId &&
                              booking.assignedTherapists?.some(
                                (t) => t._id === currentUserId
                              ) && (
                                <Button
                                  variant="danger"
                                  onClick={() => leaveBooking(booking._id)}
                                >
                                  Leave Booking
                                </Button>
                              )}
                          </Modal.Footer>
                        </Modal>
                      )}

                      {deleteSelectedBooking === booking._id && (
                        <Modal show onHide={setCloseDeletedBooking}>
                          <Modal.Header closeButton>
                            <h3 class="text-black">Delete / Cancel Booking</h3>
                          </Modal.Header>
                          <Modal.Body>
                            <div className="input-container">
                              <Form.Check
                                type="radio"
                                label="Delete (No SMS)"
                                name="deleteOptions"
                                id="deletebooking1"
                                onChange={() => setDeleteType("delete")}
                              />
                              <Form.Check
                                type="radio"
                                label="Cancel Booking (Send SMS)"
                                name="deleteOptions"
                                id="deletebooking2"
                                onChange={() => setDeleteType("cancel")}
                              />

                              <Button
                                onClick={() =>
                                  deleteBooking(booking._id, deleteType)
                                }
                              >
                                Delete / Cancel Booking
                              </Button>
                            </div>
                          </Modal.Body>
                        </Modal>
                      )}
                    </div>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bookings;

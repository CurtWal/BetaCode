import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../App.css";
function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [therapistInputs, setTherapistInputs] = useState({}); // Stores input per booking
  const [isFull, setIsFull] = useState(false);

  const checkZipDistance = async (zip1, zip2, maxDistance) => {
    const API_KEY = import.meta.env.VITE_GEO_CODIO_API;
    try {
      const [loc1, loc2] = await Promise.all([
        axios.get(
          `https://api.geocod.io/v1.7/geocode?q=${zip1}&api_key=${API_KEY}`
        ),
        axios.get(
          `https://api.geocod.io/v1.7/geocode?q=${zip2}&api_key=${API_KEY}`
        ),
      ]);

      const { lat: lat1, lng: lon1 } = loc1.data.results[0].location;
      const { lat: lat2, lng: lon2 } = loc2.data.results[0].location;

      return getDistance(lat1, lon1, lat2, lon2) <= maxDistance;
    } catch (error) {
      console.error("Error fetching ZIP code data:", error);
      return false;
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 0.621371;
  };

  const getBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const therapistId = localStorage.getItem("userId"); // Assuming therapist's userId is stored in localStorage

      // Fetch therapist's zip code from the backend
      const therapistResponse = await axios.get(
        `${import.meta.env.VITE_VERCEL}api/therapist/${therapistId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const therapistZip = therapistResponse.data.zipCode;

      // Now fetch all bookings
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Filter the bookings based on distance
      const filteredBookings = await Promise.all(
        response.data.map(async (booking) => {
          const isNearTherapist = await checkZipDistance(
            therapistZip,
            booking.zipCode,
            92 // 92 miles for 1 hour 30 min distance
          );
          return isNearTherapist ? booking : null; // Include only bookings within 1-hour 30min distance
        })
      );

      setBookings(filteredBookings.filter((booking) => booking !== null)); // Remove null values (non-matching bookings)
      console.log(filteredBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error.response?.data || error);
    }
  };

  const joinBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const therapistId = localStorage.getItem("userId");
      const therapistName = localStorage.getItem("username");

      // **Update UI instantly**
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId
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

      // **Send API request to assign therapist**
      await axios.post(
        `${import.meta.env.VITE_VERCEL}assign-therapist`,
        { bookingId, therapistId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // **Check if all spots are filled**
      const bookingResponse = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = bookingResponse.data;
      const assignedCount = booking.assignedTherapists.length;
      const remainingSpots = booking.therapist - assignedCount;

      // **If no spots are left, send email to the client**
      if (remainingSpots === 0) {
        await axios.post(
          `${import.meta.env.VITE_VERCEL}send-email-on-spot-fill`,
          { bookingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFull(true);
      }

      // **Refresh bookings in the background**
      getBookings();
    } catch (error) {
      console.error("Error joining booking:", error.response?.data || error);
    }
  };
  useEffect(() => {
    getBookings(); // Initial fetch
  }, []);

  const markComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_VERCEL2}bookings/${id}`,
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

  return (
    <div className="bookingContainer">
      <h1 style={{ textAlign: "center" }}>Bookings</h1>
      <div className="bookings-controls">
        <label>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={toggleShowCompleted}
          />
          Show Completed Bookings
        </label>
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
                  <li>EventHours: {booking.eventHours} Hours</li>
                  <li>EventIncrements: {booking.eventIncrement} Minutes</li>
                  <div className="button-container">
                    <Button onClick={() => handleShow(booking._id)}>
                      {booking.assignedTherapists.length < booking.therapist
                        ? "Assign Therapist"
                        : "Assigned"}
                    </Button>

                    {!booking.isComplete && (
                      <Button
                        onClick={() => markComplete(booking._id)}
                        style={{ marginLeft: "10px" }}
                      >
                        Mark Complete
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
                              booking.assignedTherapists.map((therapist) => (
                                <li key={therapist._id}>
                                  {therapist.username
                                    ? therapist.username
                                    : "Unknown"}
                                </li>
                              ))
                            ) : (
                              <span>No therapists assigned yet</span>
                            )}
                          </ul>
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        {booking.assignedTherapists.length <
                          booking.therapist && (
                          <Button onClick={() => joinBooking(booking._id)}>
                            Join Booking
                          </Button>
                        )}
                      </Modal.Footer>
                    </Modal>
                  )}
                </div>
              </li>
            ) : null
          )}
        </ul>
      </div>
    </div>
  );
}

export default Bookings;

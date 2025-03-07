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
  const getBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Only update if data is different
      setBookings((prevBookings) =>
        JSON.stringify(prevBookings) === JSON.stringify(response.data)
          ? prevBookings
          : response.data
      );
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

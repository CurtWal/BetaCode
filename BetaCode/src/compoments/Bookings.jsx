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

  const getBookings = async () => {
    const response = await axios.get("http://localhost:3001/bookings");
    setBookings(response.data.map((booking) => ({ ...booking })));
  };

  useEffect(() => {
    getBookings();
  }, []);

  const markComplete = async (id) => {
    try {
      await axios.put(`http://localhost:3001/bookings/${id}`, {
        isComplete: true,
      });
      setBookings(
        bookings.map((booking) =>
          booking._id === id ? { ...booking, isComplete: true } : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking:", error);
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

  const handleInputChange = (e, bookingId) => {
    const { name, value } = e.target;
    setTherapistInputs((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [name]: value,
      },
    }));
  };

  const handleSend = () => {
    console.log("Sent Data for Booking ID:", selectedBooking, therapistInputs[selectedBooking]);
    handleClose();
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

      <div className="bookings">
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
                  
                  <Button onClick={() => handleShow(booking._id)}>
                    Assign Therapist
                  </Button>

                  {!booking.isComplete && (
                    <Button
                      onClick={() => markComplete(booking._id)}
                      style={{ marginLeft: "10px" }}
                    >
                      Mark Complete
                    </Button>
                  )}

                  {/* Show modal only for the selected booking */}
                  {selectedBooking === booking._id && (
                    <Modal show onHide={handleClose}>
                      <Modal.Header closeButton>
                        <h3>Therapist Names</h3>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="input-container">
                          <input
                            type="text"
                            name="input1"
                            placeholder="Enter therapist name..."
                            value={therapistInputs[booking._id]?.input1 || ""}
                            onChange={(e) => handleInputChange(e, booking._id)}
                          />
                          <input
                            type="text"
                            name="input2"
                            placeholder="Enter therapist name..."
                            value={therapistInputs[booking._id]?.input2 || ""}
                            onChange={(e) => handleInputChange(e, booking._id)}
                          />
                          <input
                            type="text"
                            name="input3"
                            placeholder="Enter therapist name..."
                            value={therapistInputs[booking._id]?.input3 || ""}
                            onChange={(e) => handleInputChange(e, booking._id)}
                          />
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="primary" onClick={handleSend}>
                          Assign Therapist
                        </Button>
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

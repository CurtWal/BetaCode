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
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      //console.log("Token being sent:", token); // Debugging
      const response = await axios.get("http://localhost:3001/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }); 
      //console.log("Hello",response.data);

      // const therapistResponse = await axios.get(
      //   "http://localhost:3001/therapist-assignments",
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   }
      // );

      // const therapistAssignments = therapistResponse.data;
      // console.log("Therapist Assignments:", therapistResponse.data); // Merge bookings with their assigned therapists
      // const bookingsWithTherapists = response.data.map((booking) => ({
      //   ...booking,
      //   assignedTherapists: therapistAssignments
      //     .filter((ta) => String(ta.bookingId) === String(booking._id)) // 👈 Compare as Strings
      //     .map((ta) => ta.therapistId), // 👈 `therapistId` should now contain full user data
      // }));

      setBookings(response.data);
      //console.log("Bookings with Therapists:", bookingsWithTherapists);
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

      const therapistId = localStorage.getItem("userId"); // Assuming therapist's ID is stored

      const response = await axios.post(
        "http://localhost:3001/assign-therapist",
        { bookingId, therapistId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Booking joined successfully:", response.data);

      // Refresh bookings to reflect the change
      getBookings();
    } catch (error) {
      console.error("Error joining booking:", error.response?.data || error);
    }
  };
  useEffect(() => {
    getBookings();
  }, []);

  const markComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      await axios.put(
        `http://localhost:3001/bookings/${id}`,
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
    console.log(
      "Sent Data for Booking ID:",
      selectedBooking,
      therapistInputs[selectedBooking]
    );
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
                  </div>
                  {/* Show modal only for the selected booking */}
                  {selectedBooking === booking._id && (
                    <Modal show onHide={handleClose}>
                      <Modal.Header closeButton>
                        <h3>Therapist Names</h3>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="input-container">
                          <li>
                            Assigned Therapists:{" "}
                            {booking.assignedTherapists &&
                            booking.assignedTherapists.length > 0 ? (
                              booking.assignedTherapists.map((therapist) => (
                                <span key={therapist._id}>
                                  {therapist.username
                                    ? therapist.username
                                    : "Unknown"}
                                  ,
                                </span>
                              ))
                            ) : (
                              <span>No therapists assigned yet</span>
                            )}
                          </li>
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        {booking.assignedTherapists.length <
                          booking.therapist && (
                          <Button onClick={() => joinBooking(booking._id)}>
                            Join Booking
                          </Button>
                        )}
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

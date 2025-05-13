import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "../App.css";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
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
  const [sortOption, setSortOption] = useState("recent");

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

  const getBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("role"); // Assuming role is stored in localStorage

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

      if (userRole === "admin") {
        // Admin sees all bookings
        setBookings(formattedBookings);
        return;
      }

      if (userRole === "therapist") {
        // Fetch therapist's zip code
        // const therapistResponse = await axios.get(
        //   `${import.meta.env.VITE_VERCEL2}api/therapist/${userId}`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );

        // const therapistLocation = therapistResponse.data.location;
        // //const bookingLocation = response.data.location;
        // // Filter bookings based on distance
        // const filteredBookings = await Promise.all(
        //   formattedBookings.map(async (booking) => {
        //     if (!booking.location || !therapistLocation) return null;
        //     const isNearTherapist = checkLocationDistance(
        //       booking.location.lat,
        //       booking.location.lng,
        //       therapistLocation.lat,
        //       therapistLocation.lng,
        //       92
        //     );

        //     const isTherapistAssigned = booking.assignedTherapists.some(
        //       (t) => t._id === userId
        //     );
        //     const hasOpenSpots =
        //       booking.assignedTherapists.length < booking.therapist;

        //     if (isTherapistAssigned || (hasOpenSpots && isNearTherapist)) {
        //       return booking;
        //     }

        //     return null;
        //   })
        // );
        const filteredBookings = formattedBookings.filter((booking) => {
          const isTherapistAssigned = booking.assignedTherapists?.some(
            (t) => t._id === userId
          );
          const isNotFull =
            booking.assignedTherapists?.length < booking.therapist;

          return isTherapistAssigned || isNotFull;
        });
        const sortedBookings = sortBookings(filteredBookings, sortOption);

        setBookings(sortedBookings);
        return;
      }
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

          // Time overlap logic
          return newStart < existingEnd && existingStart < newEnd;
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
          !booking.assignedTherapists.some((t) => t._id === therapistId) // prevent duplicate in UI
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
      console.log(booking);
      console.log(currentUserId);
      if (remainingSpots === 0) {
        await axios.post(
          `${import.meta.env.VITE_VERCEL}send-email-on-spot-fill`,
          { bookingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFull(true);
        console.log("All Spots filled sending email");
      }

      getBookings(); // refresh UI
    } catch (error) {
      console.error("Error joining booking:", error.response?.data || error);
    } finally {
      setJoiningBookingId(null);
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
  return (
    <div>
      {userRole == "admin" && (
        <div>
          <button onClick={exportToGoogleSheet}>Export to Google Sheet</button>
        </div>
      )}

      <div className="bookingContainer">
        <h1 style={{ textAlign: "center" }}>Bookings</h1>

        <div className="bookings-controls">
          {userRole == "admin" && (
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
                    <li>EventHours: {formatEventHours(booking.eventHours)}</li>
                    <li>EventIncrements: {booking.eventIncrement} Minutes</li>
                    <li>Available Date: {booking.date}</li>
                    <li>Start Time: {booking.startTime}</li>
                    <li>End Time: {booking.endTime}</li>
                    <li>Extra Info: {booking.extra}</li>
                    <div className="button-container">
                      <Button onClick={() => handleShow(booking._id)}>
                        {booking.assignedTherapists.length < booking.therapist
                          ? "Assign Therapist"
                          : "Job Filled"}
                      </Button>

                      {!booking.isComplete && (
                        <Button
                          onClick={() => markComplete(booking._id)}
                          style={{ marginLeft: "10px" }}
                          variant="danger"
                        >
                          Mark Job Complete
                        </Button>
                      )}
                      {userRole === "admin" && (
                        // <Button onClick={() => deleteBooking(booking._id)} variant="danger">
                        //   Delete Booking
                        // </Button>
                        <Button
                          onClick={() => setThisDeletedBooking(booking._id)}
                          variant="danger"
                          style={{overflow:"clip"}}
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
                            <Button
                              onClick={() => joinBooking(booking._id)}
                              disabled={
                                currentUserId &&
                                booking.assignedTherapists.some(
                                  (t) => t._id === currentUserId
                                )
                              }
                            >
                              Join Booking
                            </Button>
                          )}
                          {currentUserId &&
                            booking.assignedTherapists.some(
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
  );
}

export default Bookings;

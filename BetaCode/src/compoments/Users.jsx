import React, { useState, useEffect } from "react";
import axios from "axios";
import "../updatepromo.css";
function Users() {
  const [users, setUsers] = useState([]);
  const [freeHourEnabled, setFreeHourEnabled] = useState(true);
  const [regularPrice, setRegularPrice] = useState(150);
  const [specialPrice, setSpecialPrice] = useState(90);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
    getFreeHourStatus();
    getBookingPrices();
  }, []);

  const getUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_VERCEL}users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error);
    }
  };
  const getFreeHourStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/freehour-status`
      );
      setFreeHourEnabled(response.data.freeHourEnabled);
      console.log("FreeHour enabled:", response.data.freeHourEnabled);
    } catch (error) {
      console.error("Error fetching free hour status:", error);
    }
  };

  const toggleFreeHour = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_VERCEL}admin/toggle-freehour`,
        {
          status: !freeHourEnabled,
        }
      );
      setFreeHourEnabled(response.data.freeHourEnabled); // Update state based on response
    } catch (error) {
      console.error("Error toggling free hour:", error.response?.data || error);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found, user is not authenticated.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_VERCEL}users/${userId}`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      getUsers(); // Refresh users list
    } catch (error) {
      console.error("Error updating user role:", error.response?.data || error);
    }
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

  const updateBookingPrices = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_VERCEL}admin/update-prices`, {
        regularBooking: regularPrice,
        specialBooking: specialPrice,
      });
      alert("Prices updated successfully");
    } catch (error) {
      console.error("Error updating booking prices:", error);
    }
  };
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div>
      <div className="toggle-container">
        <label className="toggle-label">
          Free Hour Promotion: {freeHourEnabled ? "ON" : "OFF"}
        </label>
        <button
          className={`toggle-button ${
            freeHourEnabled ? "enabled" : "disabled"
          }`}
          onClick={toggleFreeHour}
        >
          {freeHourEnabled ? "Disable Free Hour" : "Enable Free Hour"}
        </button>
      </div>

      <div className="toggle-container">
        <h2>Set Booking Prices</h2>

        <label>Regular Booking Price:</label>
        <input
          type="number"
          value={regularPrice}
          onChange={(e) => setRegularPrice(Number(e.target.value))}
          className="input-field"
        />

        <label>Special Booking Price:</label>
        <input
          type="number"
          value={specialPrice}
          onChange={(e) => setSpecialPrice(Number(e.target.value))}
          className="input-field"
        />

        <button className="update-button" onClick={updateBookingPrices}>
          Update Prices
        </button>
      </div>
      <h1>Manage Users</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{backgroundColor:"white"}}
        />
      </div>
      <ul className="bookings">
        {filteredUsers
          .filter((user) => user.role === "user")
          .map((user) => (
            <li key={user._id}>
              <div className="booking-card">
                <p>Name: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>
                  Role:
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user._id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                  </select>
                </p>
                <p>Points: {user.points}</p>
                <p>FreeHour: {user.freehour}</p>
              </div>
            </li>
          ))}
      </ul>
      <h1>Manage Therapist</h1>
      <ul className="bookings">
        {filteredUsers
          .filter((user) => user.role === "therapist")
          .map((user) => (
            <li key={user._id}>
              <div className="booking-card">
                <p>Name: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>Phone: {user.phoneNumber}</p>
                <p>Address: {user.address}</p>
                <p>Zip Code: {user.zipCode}</p>
                <p>
                  Role:
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user._id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                  </select>
                </p>
                <p>Points: {user.points}</p>
                <p>FreeHour: {user.freehour}</p>
              </div>
            </li>
          ))}
      </ul>
      <h1>Manage Admin</h1>
      <ul className="bookings">
        {filteredUsers
          .filter((user) => user.role === "admin")
          .map((user) => (
            <li key={user._id}>
              <div className="booking-card">
                <p>Name: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>
                  Role:
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user._id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                  </select>
                </p>
                <p>Points: {user.points}</p>
                <p>FreeHour: {user.freehour}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default Users;

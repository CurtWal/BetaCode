import React, { useState, useEffect } from "react";
import axios from "axios";

function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getUsers();
    }, []);

    const getUsers = async () => {
        try {
            const response = await axios.get("http://localhost:3001/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error.response?.data || error);
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
                `http://localhost:3001/users/${userId}`,
                { role: newRole },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("User role updated:", response.data);
            getUsers(); // Refresh users list
        } catch (error) {
            console.error("Error updating user role:", error.response?.data || error);
        }
    };

    return (
        <div>
            <h1>Manage Users</h1>
            <ul className="bookings">
                {users.map((user) => (
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
                                    <option value="special">Special</option>
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

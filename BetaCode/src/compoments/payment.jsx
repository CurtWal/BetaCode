import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form";
import "../index.css"; 

const Payment = ({price, payModalClose, name, email, address, zipCode, therapist, eventHours, eventIncrement}) => {
    const [paymentForm, setPaymentForm] = useState(null);
    const cardContainerRef = useRef(null);
    const isInitialized = useRef(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const initializePaymentForm = async () => {
            if (isInitialized.current || !cardContainerRef.current) return;

            try {
                const payments = window.Square.payments(import.meta.env.VITE_API_KEY2, import.meta.env.VITE_Location2);
                const card = await payments.card(
                   );
                await card.attach('#card-container'); // Ensure only one form attaches

                setPaymentForm(card);
                isInitialized.current = true;
            } catch (error) {
                console.error('Error initializing payment form:', error);
            }
        };

        initializePaymentForm();

        return () => {
            if (paymentForm) {
                paymentForm.destroy();
                setPaymentForm(null);
                isInitialized.current = false;
            }
        };
    }, []);

    useEffect(() => {
        getCurrentUser();
        
    }, []);
    
    const getCurrentUser = async () => {
        try {
            const token = localStorage.getItem("token");
    
            if (!token) {
                console.warn("No token found. User might not be logged in.");
                return;
            }
    
            const response = await axios.get(`${import.meta.env.VITE_VERCEL}users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Error fetching current user:", error.response?.data || error);
        }
    };

    const handlePaymentSubmit = async (event) => {
        event.preventDefault();
    
        if (!paymentForm) {
            console.error("Payment form not initialized");
            return;
        }
    
        try {
            const result = await paymentForm.tokenize();
            if (result.status !== "OK") {
                throw new Error("Payment tokenization failed");
            }
    
            // Process Payment
            await axios.post(`${import.meta.env.VITE_VERCEL}create-payment`, {
                sourceId: result.token,
                userId: currentUser?._id || null,
                amount: price, // Amount in cents
                currency: "USD",
            });
    
            alert("Payment successful! Booking email Sent.");
    
            // Create Booking after successful payment
            const newBooking = { name, email, address, zipCode, therapist, eventHours, eventIncrement, price };
            await axios.post(`${import.meta.env.VITE_VERCEL}new-booking`, newBooking);
    
            console.log("Booking successful");
            payModalClose();
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            
            if (error.response) {
                alert("Error processing payment or booking. Please refresh and try again.");
            } else {
                alert("Network error! Check your connection.");
            }
        }
    };

    return (
        
        <div className="payment-container">
            <h3>Payment</h3>
            <Form onSubmit={handlePaymentSubmit}>
                <div ref={cardContainerRef} id="card-container" className="card-input"></div>
                <Button type="submit" className="pay-button" disabled={!paymentForm}>Pay</Button>
            </Form>
        </div>
    );
};

export default Payment;

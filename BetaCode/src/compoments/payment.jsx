import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form";
import "../index.css"; 
const Payment = ({price, payModalClose}) => {
    const [paymentForm, setPaymentForm] = useState(null);
    const cardContainerRef = useRef(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        const initializePaymentForm = async () => {
            if (isInitialized.current || !cardContainerRef.current) return;

            try {
                const payments = window.Square.payments(process.env.API_KEY, process.env.Location);
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

    const handlePaymentSubmit = async (event) => {
        event.preventDefault();

        if (!paymentForm) {
            console.error('Payment form not initialized');
            return;
        }

        try {
            const result = await paymentForm.tokenize();
            if (result.status === 'OK') {
                const response = await axios.post('http://localhost:3001/create-payment', {
                    sourceId: result.token,
                    amount: price, // Amount in cents
                    currency: 'USD'
                });
                console.log('Payment successful:', response.data);
                alert('Payment successful! You will receive an email confirmation shortly.');
                // Handle successful payment (e.g., show success message, redirect, etc.)
                payModalClose();
            }
        } catch (error) {
            console.error('Payment error:', error.response ? error.response.data : error.message);
            // Handle payment error (e.g., show error message to user)
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

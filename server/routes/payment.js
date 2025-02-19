const express = require('express');
    const { SquareClient, SquareEnvironment, SquareError } = require("square");
    const { randomUUID } = require('crypto');
    
    const router = express.Router();
    
    const client = new SquareClient({
        environment: SquareEnvironment.Sandbox, // Use Environment.Production in production
        accessToken: process.env.Token,
    });
    
    router.post('/process-payment', async (req, res) => {
        const { paymentToken } = req.body;
    
        try {
            const response = await client.paymentsApi.createPayment({
                idempotencyKey: randomUUID(),
                sourceId: paymentToken,
                amountMoney: {
                    amount: 4000, // Amount in smallest currency unit (e.g., cents)
                    currency: 'USD',
                },
            });
    
            res.status(200).json({ message: 'Payment successful', data: response.result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Payment failed', details: error.result });
        }
    });
    
    module.exports = router;
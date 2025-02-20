const express = require('express');
const { Client, Environment } = require('square/legacy');
const { randomUUID } = require('crypto');

const router = express.Router();

// Make sure you have the SQUARE_ACCESS_TOKEN in your .env file
const accessToken = process.env.Token;

if (!accessToken) {
    console.error('SQUARE_ACCESS_TOKEN is not set in the environment variables');
    process.exit(1);
}

const client = new Client({
    accessToken: accessToken,
    environment: Environment.Sandbox // Use Environment.Production for live transactions
});

router.post('/create-payment', async (req, res) => {
    console.log('Received payment request:', req.body);
    const { sourceId, amount, currency } = req.body;

    try {
        const response = await client.paymentsApi.createPayment({
            sourceId: sourceId,
            idempotencyKey: randomUUID(),
            amountMoney: {
                amount: amount,
                currency: currency,
            },
        });
        const safeResponse = JSON.parse(JSON.stringify(response.result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        console.log('Payment successful:', safeResponse);
        res.status(200).json(safeResponse);
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(500).json({ error: 'Payment failed', details: error.message });
    }
});

module.exports = router;
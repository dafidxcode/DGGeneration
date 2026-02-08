import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const BACKEND_URL = process.env.VITE_BASE_URL;

// Music Generation Proxy (POST)
// Mounted at /api/music
router.post('/music', async (req, res) => {
    try {
        const payload = req.body;

        console.log('Proxying Music Generation Request to Backend');

        const response = await fetch(`${BACKEND_URL}/api/music`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Music Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Music Polling Proxy (GET)
// Mounted at /api/music
router.get('/music', async (req, res) => {
    try {
        const { requestId } = req.query;

        if (!requestId) {
            return res.status(400).json({ error: 'Missing requestId' });
        }

        const requestUrl = `${BACKEND_URL}/api/music?requestId=${requestId}`;
        console.log('Proxying Music Polling Request to Backend');

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('Music Polling Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const BACKEND_URL = process.env.VITE_BASE_URL;

// ==================== NANO BANANA IMAGE ====================

// Image Generation Proxy (POST) - Nano Banana
// Mounted at /api/image
router.post('/image', async (req, res) => {
    try {
        const payload = req.body;

        console.log('Proxying Image Generation Request to Backend');

        const response = await fetch(`${BACKEND_URL}/api/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Image Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Image Polling Proxy (GET) - Nano Banana
// Mounted at /api/image
router.get('/image', async (req, res) => {
    try {
        const { requestId } = req.query;

        if (!requestId) {
            return res.status(400).json({ error: 'Missing requestId' });
        }

        const requestUrl = `${BACKEND_URL}/api/image?requestId=${requestId}`;
        console.log('Proxying Image Polling Request to Backend');

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('Image Polling Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==================== GOOGLE IMAGEN ====================

// Imagen Generation Proxy (POST) - Google Imagen
// Mounted at /api/imagen
router.post('/imagen', async (req, res) => {
    try {
        const payload = req.body;

        console.log('Proxying Imagen Generation Request to Backend');

        const response = await fetch(`${BACKEND_URL}/api/imagen`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Imagen Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Imagen Polling Proxy (GET) - Google Imagen
// Mounted at /api/imagen
router.get('/imagen', async (req, res) => {
    try {
        const { requestId } = req.query;

        if (!requestId) {
            return res.status(400).json({ error: 'Missing requestId' });
        }

        const requestUrl = `${BACKEND_URL}/api/imagen?requestId=${requestId}`;
        console.log('Proxying Imagen Polling Request to Backend');

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('Imagen Polling Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

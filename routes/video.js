import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Video Generation Proxy (POST)
router.post('/video', async (req, res) => {
    try {
        const { prompt, model, ratio, type, imageUrls } = req.body;

        const baseUrl = 'https://viinapi.netlify.app/api/video';

        // Manual URL Construction to avoid auto-encoding (as requested)
        let requestUrl = `${baseUrl}?`;

        // 1. Image URLs (Unencoded, at start)
        if (type === 'image-to-video' && imageUrls) {
            requestUrl += `imageUrls=${imageUrls}&`;
        } // logic for unencoded imageUrls

        // 2. Standard Params (Unencoded "Plain Text" style as requested)
        requestUrl += `prompt=${prompt}&`;
        requestUrl += `model=${model || 'veo-3.1-fast'}&`;
        requestUrl += `ratio=${ratio || '16:9'}&`;
        requestUrl += `type=${type || 'text-to-video'}`;

        console.log('Proxying Video Request:', requestUrl);

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('Video Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Video Polling Proxy (GET)
// Mounted at /api/video
router.get('/video', async (req, res) => {
    try {
        const { requestId } = req.query;
        if (!requestId) {
            return res.status(400).json({ error: 'Missing requestId' });
        }

        const baseUrl = 'https://viinapi.netlify.app/api/video';
        const requestUrl = `${baseUrl}?requestId=${requestId}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('Polling Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

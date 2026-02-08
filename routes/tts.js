import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const BACKEND_URL = process.env.VITE_BASE_URL;

// TTS Generation Proxy (GET)
// Mounted at /api/tts
router.get('/tts', async (req, res) => {
    try {
        const { text, voice, language, engine, speed, pitch, stability } = req.query;

        if (!text) {
            return res.status(400).json({ error: 'Missing text parameter' });
        }

        // Build query string for backend
        const params = new URLSearchParams();
        if (text) params.append('text', text);
        if (voice) params.append('voice', voice);
        if (language) params.append('language', language);
        if (engine) params.append('engine', engine);
        if (speed) params.append('speed', speed);
        if (pitch) params.append('pitch', pitch);
        if (stability) params.append('stability', stability);

        const requestUrl = `${BACKEND_URL}/api/tts?${params.toString()}`;
        console.log('Proxying TTS Request to Backend');

        const response = await fetch(requestUrl);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('TTS Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

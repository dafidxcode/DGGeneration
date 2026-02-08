import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// API Proxy for downloading resources
router.get('/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await fetch(decodedUrl);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch resource' });
        }

        // Copy important headers
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        if (contentType) res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', `attachment; filename="${decodedUrl.split('/').pop() || 'download'}"`);

        // Stream the response
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

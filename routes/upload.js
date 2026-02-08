import express from 'express';
import fetch from 'node-fetch';
import multer from 'multer';
import FormData from 'form-data';

const router = express.Router();

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// File Upload Endpoint (Proxies to tmpfiles.org)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname);

        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.url) {
            // Transform URL to direct download link
            // tmpfiles.org returns: https://tmpfiles.org/12345/image.jpg
            // Direct link is: https://tmpfiles.org/dl/12345/image.jpg
            const originalUrl = result.data.url;
            const directUrl = originalUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

            return res.json({
                status: 'success',
                data: {
                    url: directUrl
                }
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ status: 'error', error: 'Internal server error during upload' });
    }
});

export default router;

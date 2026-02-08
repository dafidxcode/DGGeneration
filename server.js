import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

// Import Routes
import videoRoutes from './routes/video.js';
import uploadRoutes from './routes/upload.js';
import proxyRoutes from './routes/proxy.js';
import ttsRoutes from './routes/tts.js';
import musicRoutes from './routes/music.js';
import imageRoutes from './routes/image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'dist')));

app.use('/api', videoRoutes);
app.use('/api', uploadRoutes);
app.use('/api', proxyRoutes);
app.use('/api', ttsRoutes);
app.use('/api', musicRoutes);
app.use('/api', imageRoutes);

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

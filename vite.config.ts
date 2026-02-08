import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/upload-tmp': {
          target: 'https://tmpfiles.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/upload-tmp/, '/api/v1/upload'),
        },
        '/api/db': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/upload': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/tts': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/music': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/image': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/imagen': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/video': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/proxy': {
          target: 'http://localhost:3001', // Self-reference, we hijack it in configureServer
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // This dummy proxy isn't strictly needed if we handle it in simple middleware
              // But let's use a simpler middleware approach directly in Vite without 'proxy' object complication
            });
          },
          bypass: (req, res, options) => {
            // We will handle this manually in configureServer below, but let's keep it simple:
            // Actually, implementing a custom middleware is cleaner than configuring http-proxy-middleware for dynamic targets
            return req.url; // Bypass standard proxy to let middleware handle it
          }
        }
      },
    },
    plugins: [
      react(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/proxy', async (req, res, next) => {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            // req.url in middleware is relative to the mount point '/api/proxy', so it might be '/?url=...'
            // But let's check full URL parsing
            const targetUrlParam = urlObj.searchParams.get('url');

            if (!targetUrlParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'URL parameter is required' }));
              return;
            }

            try {
              const decodedUrl = decodeURIComponent(targetUrlParam);
              // Use native fetch (Node 18+)
              const response = await fetch(decodedUrl);

              if (!response.ok) {
                res.statusCode = response.status;
                res.end(JSON.stringify({ error: 'Failed to fetch resource' }));
                return;
              }

              // Copy headers
              const contentType = response.headers.get('content-type');
              if (contentType) res.setHeader('Content-Type', contentType);

              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Content-Disposition', `attachment; filename="${decodedUrl.split('/').pop() || 'download'}"`);

              // Stream pipe
              // Node fetch body is a ReadableStream, we need to convert to Node stream or buffer
              const arrayBuffer = await response.arrayBuffer();
              res.end(Buffer.from(arrayBuffer));
            } catch (error) {
              console.error('Proxy Middleware Error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            ui: ['lucide-react']
          }
        }
      }
    }
  };
});

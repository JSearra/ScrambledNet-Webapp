import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './', // Use relative paths for assets
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['assets/logo.png', 'assets/favicon.ico', 'assets/apple-touch-icon.png'],
            manifest: {
                name: 'Scrambled Net',
                short_name: 'ScrambledNet',
                description: 'A puzzle game to connect the network',
                theme_color: '#222222',
                background_color: '#222222',
                display: 'standalone',
                scope: './',
                start_url: './',
                icons: [
                    {
                        src: 'assets/logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'assets/logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,jpg,svg,json,ogg}'],
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                            },
                        },
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'audio',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'audio',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                            },
                        },
                    }
                ]
            }
        })
    ]
});

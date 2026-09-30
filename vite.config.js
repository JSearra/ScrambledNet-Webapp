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
            includeAssets: ['assets/logo.png', 'assets/favicon.ico', 'assets/apple-touch-icon.png', 'privacy.html'],
            manifest: {
                id: 'scramblednet',
                name: 'Scrambled Net',
                short_name: 'ScrambledNet',
                description: 'A puzzle game to connect the network',
                theme_color: '#222222',
                background_color: '#222222',
                display: 'standalone',
                scope: './',
                start_url: './',
                lang: 'en',
                dir: 'ltr',
                orientation: 'any',
                categories: ['games', 'puzzle', 'entertainment'],
                icons: [
                    {
                        src: 'assets/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'assets/logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'assets/icon-maskable-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'assets/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                screenshots: [
                    {
                        src: 'screenshots/wide-menu.png',
                        sizes: '1366x768',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'Choose a difficulty from Novice to Insane'
                    },
                    {
                        src: 'screenshots/wide-game.png',
                        sizes: '1366x768',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'Rotate the cables to connect every computer to the server'
                    },
                    {
                        src: 'screenshots/narrow-game.png',
                        sizes: '720x1280',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'Rotate the cables to connect every computer to the server'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,jpg,svg,json,ogg,wav}'],
                // Store/manifest screenshots are only needed by installers, not offline play
                globIgnores: ['screenshots/**'],
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

import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: mode === 'production' 
                    ? ['babel-plugin-react-compiler'] 
                    : [],
            },
        }),
        wayfinder({
            formVariants: true,
        }),
        tailwindcss(),
    ],
    optimizeDeps: {
        exclude: ['@tailwindcss/vite'],
    },
    server: {
        watch: {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/storage/**',
                '**/vendor/**',
                '**/public/build/**',
            ],
        },
        hmr: {
            overlay: true,
        },
    },
    build: {
        minify: mode === 'production',
        sourcemap: mode !== 'production',
        chunkSizeWarningLimit: 1000,
    },
}));
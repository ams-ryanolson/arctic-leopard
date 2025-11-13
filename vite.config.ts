import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: process.env.NODE_ENV === 'production' 
                    ? ['babel-plugin-react-compiler'] 
                    : [],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
        // Drop console and debugger in production only
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    // Add these optimizations:
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            'date-fns',
            'clsx',
            'tailwind-merge',
        ],
        exclude: ['@tailwindcss/vite'],
        // Force re-optimization only when needed
        force: false,
    },
    server: {
        watch: {
            // Reduce file watching overhead
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/storage/**',
                '**/vendor/**',
                '**/public/build/**',
            ],
        },
        // Increase HMR timeout for large projects
        hmr: {
            overlay: true,
        },
    },
    build: {
        // Only apply minification in production
        minify: false,
        // Disable sourcemaps in dev for faster builds
        sourcemap: false,
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
    },
});

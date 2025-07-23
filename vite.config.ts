import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true,
    // Optimize for WebContainer environments
    hmr: {
      // Reduce HMR polling to avoid timer issues
      overlay: false,
    },
    // Disable file watching optimizations that might cause timer issues
    watch: {
      usePolling: false,
      interval: 1000,
    },
  },
  build: {
    // Optimize build for better compatibility
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  // Optimize dependencies to reduce timer usage
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Define global constants to avoid runtime timer issues
  define: {
    // Ensure proper timer handling
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
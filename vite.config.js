import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

// The React app lives in resources/js and is served by Laravel through
// resources/views/app.blade.php. In development the @vite directive points the
// page at this dev server for hot reload; `npm run build` writes hashed files
// to public/build, which Laravel serves itself. The page and the API share one
// origin either way, so there is no proxy or CORS setup.
export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/main.jsx'],
      refresh: true,
    }),
    react(),
  ],
});

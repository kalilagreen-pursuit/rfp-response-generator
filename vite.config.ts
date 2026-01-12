import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // SECURITY FIX: Removed API key exposure to client bundle
      // All Gemini API calls should go through backend endpoints
      define: {
        // No API keys exposed to client-side code
      },
      resolve: {
        alias: {
          // Fix: __dirname is not available in ES modules. Using import.meta.url is the modern way to get the current directory path.
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      }
    };
});
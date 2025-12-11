import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose the API_KEY to the client-side code
      // This is safe because Vercel injects it during build
      // Fallback to empty string to prevent undefined errors during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});
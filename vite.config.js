import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { generateOAuthLogo } from './scripts/generate-oauth-logo.mjs';

export default defineConfig(async () => {
  try {
    const { report } = await generateOAuthLogo();
    console.log('[starmeet] OAuth logo ready:\n' + report);
  } catch (e) {
    console.warn('[starmeet] OAuth logo generation skipped:', e.message);
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});

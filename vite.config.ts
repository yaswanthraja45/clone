import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // This repository is deployed at https://yaswanthraja45.github.io/clone/
  base: '/clone/',
  plugins: [react(), tailwindcss()],
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

import { cloudflare } from "@cloudflare/vite-plugin";

import { execSync } from 'child_process';
import fs from 'fs';

// Force load .env overriding process environment for Vite build
dotenv.config({ override: true });

function generateBuildInfoPlugin() {
  return {
    name: 'generate-build-info',
    buildStart() {
      let gitSha = '0337510';
      let gitFullSha = '0337510a23d62e79c986a26aed42921994691707';
      try {
        gitSha = execSync('git rev-parse --short HEAD').toString().trim();
        gitFullSha = execSync('git rev-parse HEAD').toString().trim();
      } catch (e) {
        console.warn('Could not retrieve git sha:', e);
      }
      const buildInfo = {
        version: '9.0.0',
        gitSha,
        gitFullSha,
        buildTime: new Date().toISOString(),
        environment: 'LIVE'
      };
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(
        path.resolve(publicDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
      );
    }
  };
}

export default defineConfig(() => {
  let gitSha = '0337510';
  let gitFullSha = '0337510a23d62e79c986a26aed42921994691707';
  try {
    gitSha = execSync('git rev-parse --short HEAD').toString().trim();
    gitFullSha = execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {}

  return {
    plugins: [generateBuildInfoPlugin(), react(), tailwindcss(), cloudflare()],
    define: {
      'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
      'import.meta.env.VITE_GIT_FULL_SHA': JSON.stringify(gitFullSha),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
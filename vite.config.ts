import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import dotenv from 'dotenv';

import { cloudflare } from "@cloudflare/vite-plugin";

import { execSync } from 'child_process';
import fs from 'fs';

// Force load .env overriding process environment for Vite build
dotenv.config({ override: true });

function generateBuildInfoPlugin(targetEnv: string = 'LIVE') {
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
        environment: targetEnv
      };
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(
        path.resolve(publicDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
      );
    },
    closeBundle() {
      const distAssetsIgnore = path.resolve(__dirname, 'dist/client/.assetsignore');
      try {
        if (fs.existsSync(distAssetsIgnore)) {
          const content = fs.readFileSync(distAssetsIgnore, 'utf-8');
          if (!content.includes('*.exe')) {
            fs.appendFileSync(distAssetsIgnore, '\ndownloads/*\n*.exe\n*.msi\n*.dmg\n*.pkg\n');
          }
        } else {
          fs.writeFileSync(distAssetsIgnore, 'wrangler.json\n.dev.vars\ndownloads/*\n*.exe\n*.msi\n*.dmg\n*.pkg\n');
        }
      } catch (e) {
        console.warn('Could not update .assetsignore in dist/client:', e);
      }
    }
  };
}

export default defineConfig(({ mode, command }) => {
  const targetEnv = mode === 'staging' ? 'STAGING' : 'LIVE';

  // Fail closed if staging build is attempted with missing or production Firebase configuration
  if (mode === 'staging') {
    const env = loadEnv(mode, process.cwd(), '');
    const stagingProjectId = env.VITE_STAGING_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_STAGING_FIREBASE_PROJECT_ID;
    if (!stagingProjectId || stagingProjectId === 'orion9-dev-db-2026') {
      throw new Error(
        '[STAGING-BUILD-VALIDATION-ERROR] Staging build failed: Staging Firebase configuration is unavailable or matches the production project. ' +
        'A dedicated staging Firebase project configuration (.env.staging with distinct VITE_FIREBASE_PROJECT_ID) is required before building for staging.'
      );
    }
  }
  let gitSha = '0337510';
  let gitFullSha = '0337510a23d62e79c986a26aed42921994691707';
  try {
    gitSha = execSync('git rev-parse --short HEAD').toString().trim();
    gitFullSha = execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {}

  return {
    plugins: [
      generateBuildInfoPlugin(targetEnv),
      react(),
      tailwindcss(),
      ...(command === 'build' || process.env.CLOUDFLARE_VITE_DEV === 'true' ? [cloudflare()] : [])
    ],
    define: {
      'import.meta.env.VITE_ORION_ENV': JSON.stringify(targetEnv),
      'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
      'import.meta.env.VITE_GIT_FULL_SHA': JSON.stringify(gitFullSha),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@babel') || id.includes('tslib')) return 'vendor-react';
              if (id.includes('three')) return 'vendor-three';
              if (id.includes('maplibre-gl')) return 'vendor-maps';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('xlsx')) return 'vendor-excel';
              if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src-tauri/target/**', '**/scratch/**', '**/public/downloads/**', '**/*.exe', '**/*.msi'],
      },
    },
  };
});